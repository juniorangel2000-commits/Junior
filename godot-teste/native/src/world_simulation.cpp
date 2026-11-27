#include "world_simulation.hpp"
#include <godot_cpp/core/class_db.hpp>
#include <godot_cpp/variant/color.hpp>
#include <godot_cpp/variant/vector2.hpp>
#include <algorithm>
#include <cmath>
#include <numbers>

using namespace godot;
namespace {
constexpr int max_day = 999999;
constexpr double day_length = 1440.0;
constexpr double chance[] = {0.34, 0.18, 0.30, 0.24};
// Horários artísticos distintos, interpolados continuamente. Céu aberto.
struct LightKey { double at, r, g, b, saturation, contrast, vignette; };
constexpr LightKey keys[] = {
    {0,.25,.32,.56,.70,1.01,.18},
    {240,.24,.30,.51,.68,1.01,.19},
    {300,.36,.39,.63,.75,1.01,.16}, // aurora azul
    {330,.53,.45,.66,.82,1.02,.14}, // aurora rosada
    {360,.80,.66,.70,.95,1.02,.10}, // horizonte rosa
    {390,1.04,.87,.73,1.02,1.02,.06}, // nascer dourado
    {450,1.03,.98,.87,1.04,1.02,.03},
    {540,1.01,1.00,.96,1.04,1.01,.02}, // manhã clara
    {720,1.00,1.00,1.00,1.02,1.01,.02}, // meio-dia
    {900,1.02,.98,.90,1.05,1.02,.035}, // tarde
    {990,1.04,.94,.80,1.07,1.03,.06}, // início hora dourada
    {1050,1.08,.88,.68,1.08,1.03,.08},
    {1095,1.08,.76,.58,1.08,1.03,.11}, // pôr do sol
    {1140,.83,.56,.64,.92,1.02,.14}, // crepúsculo rosa
    {1170,.58,.48,.72,.85,1.02,.16}, // hora azul
    {1200,.36,.37,.63,.75,1.01,.18},
    {1260,.27,.33,.57,.70,1.01,.18},
    {1440,.25,.32,.56,.70,1.01,.18}
};
double lerp_value(double a,double b,double x) { return a+(b-a)*x; }
}
void AfterRainWorld::_bind_methods() {
    ClassDB::bind_method(D_METHOD("set_clock","day","minute"), &AfterRainWorld::set_clock);
    ClassDB::bind_method(D_METHOD("advance","minutes"), &AfterRainWorld::advance);
    ClassDB::bind_method(D_METHOD("snapshot"), &AfterRainWorld::snapshot);
    ClassDB::bind_method(D_METHOD("rain_for_day","day"), &AfterRainWorld::rain_for_day);
    ClassDB::bind_method(D_METHOD("resource_hit","hits","required"), &AfterRainWorld::resource_hit);
    ClassDB::bind_method(D_METHOD("resource_strike","hits","required","damage"), &AfterRainWorld::resource_strike);
    ClassDB::bind_method(D_METHOD("tool_strike","tier","durability","work"), &AfterRainWorld::tool_strike);
    ClassDB::bind_method(D_METHOD("settle_crop","from","to","growth","required","mask","watered"), &AfterRainWorld::settle_crop);
}
void AfterRainWorld::set_clock(int p_day,double p_minute) {
    day=std::clamp(p_day,1,max_day);
    minute=std::isfinite(p_minute)?std::clamp(p_minute,0.0,1439.999):480.0;
}
int AfterRainWorld::advance(double minutes) {
    if (!std::isfinite(minutes)||minutes<=0) return 0;
    const int old=day;
    const double remaining=(max_day-day)*day_length+(1439.999-minute);
    if (minutes>=remaining) {day=max_day;minute=1439.999;return day-old;}
    const double total=minute+minutes;
    day+=static_cast<int>(std::floor(total/day_length));
    minute=std::fmod(total,day_length);
    return day-old;
}
bool AfterRainWorld::rain_for_day(int p_day) const {
    if(p_day<=1) return false;
    uint32_t h=(static_cast<uint32_t>(p_day)^0x9e3779b9u)*0x85ebca6bu;
    h^=h>>13; h*=0xc2b2ae35u; h^=h>>16;
    h=(h^0x27d4eb2fu)*0x165667b1u; h^=h>>15;
    return static_cast<double>(h)/4294967296.0 < chance[((p_day-1)/28)%4];
}
Dictionary AfterRainWorld::snapshot() const {
    const int n=day-1;
    const bool rain=rain_for_day(day);
    size_t i=1;
    while(i<sizeof(keys)/sizeof(keys[0])-1 && minute>=keys[i].at) ++i;
    const auto &a=keys[i-1], &b=keys[i];
    double x=(minute-a.at)/(b.at-a.at); x=x*x*(3-2*x);
    double r=lerp_value(a.r,b.r,x),g=lerp_value(a.g,b.g,x),bl=lerp_value(a.b,b.b,x);
    double sat=lerp_value(a.saturation,b.saturation,x);
    if(rain){r*=.74;g*=.79;bl*=.88;sat*=.72;}
    const double progress=std::clamp((minute-360.0)/780.0,0.0,1.0);
    const double elevation=std::sin(progress*std::numbers::pi);
    const double fade=std::clamp(std::min((minute-360.0)/30.0,(1140.0-minute)/25.0),0.0,1.0);
    // Sol baixo = sombra longa e oblíqua; sol alto = curta.
    const double length=.24+1.05*std::pow(1-elevation,1.35);
    const double horizontal=std::cos(progress*std::numbers::pi)*length;
    const double depth=.18+.26*(1-elevation);
    const double strength=(.38+.12*elevation)*fade*(rain?.14:1.0);
    Dictionary result;
    result["day"]=day; result["minute"]=minute;
    result["year"]=n/112+1; result["season"]=(n/28)%4; result["day_of_season"]=n%28+1;
    result["rain"]=rain; result["ambient"]=Color(r,g,bl,1.0);
    result["saturation"]=sat; result["contrast"]=lerp_value(a.contrast,b.contrast,x);
    result["shadow_offset"]=Vector2(horizontal,depth);
    result["shadow_opacity"]=strength;
    result["vignette"]=lerp_value(a.vignette,b.vignette,x);
    return result;
}

Dictionary AfterRainWorld::settle_crop(int from,int to,int growth,int required,int mask,bool watered) const {
    Dictionary result;
    from=std::clamp(from,1,max_day); to=std::clamp(to,from,max_day);
    required=std::clamp(required,1,365); growth=std::clamp(growth,0,required);
    bool alive=true; int missed=0;
    for(int d=from;d<to;++d){
        if(watered||rain_for_day(d)) growth=std::min(required,growth+1);
        else if(growth<required) ++missed;
        watered=false;
        if((mask & (1<<((d/28)%4)))==0){alive=false;break;}
    }
    result["alive"]=alive; result["days"]=growth; result["day"]=to;
    result["watered"]=alive&&(watered||rain_for_day(to)); result["missed"]=missed;
    return result;
}

int AfterRainWorld::resource_hit(int hits,int required) const {
    if(required<1||required>100||hits<0||hits>=required)return -1;
    return hits+1;
}

// Golpe com dano (ferramentas melhores tiram mais de um "golpe" do recurso por vez).
int AfterRainWorld::resource_strike(int hits,int required,int damage) const {
    if(required<1||required>100||hits<0||hits>=required||damage<1||damage>100)return -1;
    return std::min(required,hits+damage);
}

// Uso de ferramenta da V51 (src/systems/economy.ts): eficiência por nível com a fração guardada
// para o golpe seguinte e 1 de durabilidade por uso. damage 0 = ferramenta gasta.
Dictionary AfterRainWorld::tool_strike(int tier,int durability,double work) const {
    static constexpr double efficiency[4]={1.0,1.5,2.2,3.2};
    static constexpr int max_durability[4]={100,250,450,800};
    Dictionary result;
    const bool valid=tier>=0&&tier<=3&&std::isfinite(work)&&work>=0.0&&work<1.0&&durability>=0&&durability<=max_durability[std::clamp(tier,0,3)];
    if(!valid||durability==0){
        result["damage"]=0; result["durability"]=valid?durability:0; result["work"]=valid?work:0.0;
        return result;
    }
    const double total=efficiency[tier]+work;
    result["damage"]=static_cast<int>(std::floor(total));
    result["durability"]=durability-1;
    result["work"]=std::fmod(total,1.0);
    return result;
}

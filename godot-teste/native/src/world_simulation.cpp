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
struct LightKey { double at, r, g, b, saturation, contrast; };
constexpr LightKey keys[] = {
    {0,.25,.31,.52,.62,1.04},{270,.27,.32,.52,.64,1.04},
    {345,.62,.50,.62,.82,1.02},{400,1.02,.86,.82,.98,1.03},
    {480,1,.97,.92,1.04,1.03},{720,1,1,.99,1.06,1.03},
    {960,1,.97,.9,1.07,1.04},{1065,1.05,.9,.74,1.1,1.05},
    {1125,.9,.68,.6,1.04,1.05},{1180,.44,.42,.62,.78,1.05},
    {1260,.27,.32,.53,.64,1.04},{1440,.25,.31,.52,.62,1.04}
};
double lerp_value(double a,double b,double x) { return a+(b-a)*x; }
}
void AfterRainWorld::_bind_methods() {
    ClassDB::bind_method(D_METHOD("set_clock","day","minute"), &AfterRainWorld::set_clock);
    ClassDB::bind_method(D_METHOD("advance","minutes"), &AfterRainWorld::advance);
    ClassDB::bind_method(D_METHOD("snapshot"), &AfterRainWorld::snapshot);
    ClassDB::bind_method(D_METHOD("rain_for_day","day"), &AfterRainWorld::rain_for_day);
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
    const double length=.22+.52*(1-elevation);
    Dictionary result;
    result["day"]=day; result["minute"]=minute;
    result["year"]=n/112+1; result["season"]=(n/28)%4; result["day_of_season"]=n%28+1;
    result["rain"]=rain; result["ambient"]=Color(r,g,bl,1.0);
    result["saturation"]=sat; result["contrast"]=lerp_value(a.contrast,b.contrast,x);
    result["shadow_offset"]=Vector2(std::cos(progress*std::numbers::pi)*length,.42*length);
    result["shadow_opacity"]=(.5+.08*elevation)*fade*(rain?.20:1.0);
    return result;
}

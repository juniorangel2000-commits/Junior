#pragma once
#include <godot_cpp/classes/ref_counted.hpp>
#include <godot_cpp/variant/dictionary.hpp>
#include <cstdint>

namespace godot {
class AfterRainWorld : public RefCounted {
    GDCLASS(AfterRainWorld, RefCounted)
    int day = 1;
    double minute = 480.0;
protected:
    static void _bind_methods();
public:
    void set_clock(int p_day, double p_minute);
    int advance(double minutes);
    Dictionary snapshot() const;
    bool rain_for_day(int p_day) const;
    int resource_hit(int hits,int required) const;
    Dictionary settle_crop(int from, int to, int growth, int required, int mask, bool watered) const;
};
}

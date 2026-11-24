#pragma once
#include <godot_cpp/classes/ref_counted.hpp>
#include <godot_cpp/variant/vector2.hpp>

namespace godot {
class AfterRainMovement : public RefCounted {
    GDCLASS(AfterRainMovement, RefCounted)
protected:
    static void _bind_methods();
public:
    Vector2 calculate_velocity(const Vector2 &input, double speed) const;
};
}

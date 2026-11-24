#include "movement.hpp"
#include <godot_cpp/core/class_db.hpp>
#include <cmath>

using namespace godot;

void AfterRainMovement::_bind_methods() {
    ClassDB::bind_method(D_METHOD("calculate_velocity", "input", "speed"), &AfterRainMovement::calculate_velocity);
}

Vector2 AfterRainMovement::calculate_velocity(const Vector2 &input, double speed) const {
    if (!std::isfinite(speed) || speed < 0.0 || !std::isfinite(input.x) || !std::isfinite(input.y)) {
        return Vector2();
    }
    return input.normalized() * static_cast<real_t>(speed);
}

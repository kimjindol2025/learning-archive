// Core Traits
// Defines common behavior for runtime values

use crate::core::Value;

/// Trait for callable values (functions)
pub trait Callable {
    /// Call the function with arguments
    fn call(&self, args: Vec<Value>) -> Result<Value, String>;

    /// Get function name
    fn name(&self) -> &str;

    /// Get function arity (number of parameters)
    fn arity(&self) -> Option<usize>;
}

/// Trait for displayable values
pub trait Displayable {
    /// Convert to human-readable string
    fn display(&self) -> String;

    /// Convert to debug representation
    fn debug(&self) -> String;
}

/// Trait for comparable values
pub trait Comparable {
    /// Compare two values
    fn compare(&self, other: &Value) -> std::cmp::Ordering;
}

/// Trait for values that support iteration
pub trait Iterable {
    /// Get iterator
    fn iter(&self) -> Box<dyn Iterator<Item = Value>>;

    /// Get length
    fn len(&self) -> usize;

    /// Check if empty
    fn is_empty(&self) -> bool {
        self.len() == 0
    }
}

// Core Types Module
// Defines fundamental types used throughout the runtime

pub mod value;
pub mod object;
pub mod traits;

pub use value::Value;
pub use object::Object;
pub use traits::{Callable, Displayable};

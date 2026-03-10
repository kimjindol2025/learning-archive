// Executor
// Executes individual instructions and functions

use crate::core::Value;

/// Executor for FreeLang instructions
pub struct Executor;

impl Executor {
    /// Execute a function call
    pub fn call_function(func: Value, args: Vec<Value>) -> Result<Value, String> {
        match func {
            Value::Function(_) => {
                // TODO: Implement function call
                Ok(Value::Null)
            }
            _ => Err(format!("Cannot call non-function: {}", func.type_of())),
        }
    }

    /// Execute binary operation
    pub fn binary_op(op: &str, left: Value, right: Value) -> Result<Value, String> {
        match op {
            "+" => {
                let l = left.to_number();
                let r = right.to_number();
                Ok(Value::Number(l + r))
            }
            "-" => {
                let l = left.to_number();
                let r = right.to_number();
                Ok(Value::Number(l - r))
            }
            "*" => {
                let l = left.to_number();
                let r = right.to_number();
                Ok(Value::Number(l * r))
            }
            "/" => {
                let l = left.to_number();
                let r = right.to_number();
                if r == 0.0 {
                    Err("Division by zero".to_string())
                } else {
                    Ok(Value::Number(l / r))
                }
            }
            "==" => Ok(Value::Bool(left.equals(&right))),
            "!=" => Ok(Value::Bool(!left.equals(&right))),
            "<" => Ok(Value::Bool(left.to_number() < right.to_number())),
            ">" => Ok(Value::Bool(left.to_number() > right.to_number())),
            "<=" => Ok(Value::Bool(left.to_number() <= right.to_number())),
            ">=" => Ok(Value::Bool(left.to_number() >= right.to_number())),
            _ => Err(format!("Unknown operator: {}", op)),
        }
    }

    /// Execute unary operation
    pub fn unary_op(op: &str, operand: Value) -> Result<Value, String> {
        match op {
            "-" => Ok(Value::Number(-operand.to_number())),
            "!" => Ok(Value::Bool(!operand.is_truthy())),
            _ => Err(format!("Unknown unary operator: {}", op)),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_binary_add() {
        let result = Executor::binary_op("+", Value::Number(5.0), Value::Number(3.0));
        assert!(result.is_ok());
    }

    #[test]
    fn test_binary_div_by_zero() {
        let result = Executor::binary_op("/", Value::Number(5.0), Value::Number(0.0));
        assert!(result.is_err());
    }
}

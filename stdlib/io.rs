// I/O Functions (15)
// File and console operations

use crate::core::Value;

pub fn print(args: Vec<Value>) -> Result<Value, String> {
    for arg in args {
        print!("{}", arg);
    }
    Ok(Value::Null)
}

pub fn println(args: Vec<Value>) -> Result<Value, String> {
    for arg in args {
        println!("{}", arg);
    }
    Ok(Value::Null)
}

pub fn input(_args: Vec<Value>) -> Result<Value, String> {
    use std::io::stdin;
    let mut buffer = String::new();
    stdin().read_line(&mut buffer)
        .map_err(|e| e.to_string())?;
    Ok(Value::String(buffer.trim().to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_print() {
        let result = print(vec![Value::String("hello".to_string())]);
        assert!(result.is_ok());
    }
}

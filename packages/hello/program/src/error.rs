use num_derive::FromPrimitive as DeriveFromPrimitive;
use num_traits::FromPrimitive;
use solana_program::{
  decode_error::DecodeError,
  msg,
  program_error::{PrintProgramError, ProgramError},
};
use thiserror::Error;

/// Re-exporting PrintProgramError as PrintAppError for convention
pub use solana_program::program_error::PrintProgramError as PrintAppError;

/// Errors that may be returned by the app program.
#[derive(Clone, Debug, Eq, Error, DeriveFromPrimitive, PartialEq)]
pub enum AppError {
  #[error("Invalid instruction")]
  InvalidInstruction,
  #[error("Incorrect program id")]
  IncorrectProgramId,
  #[error("Operation overflowed")]
  Overflow,
}

impl From<AppError> for ProgramError {
  fn from(e: AppError) -> Self {
    ProgramError::Custom(e as u32)
  }
}

impl<T> DecodeError<T> for AppError {
  fn type_of() -> &'static str {
    "AppError"
  }
}

impl PrintProgramError for AppError {
  fn print<E>(&self)
  where
    E: 'static + std::error::Error + DecodeError<E> + PrintProgramError + FromPrimitive,
  {
    match self {
      AppError::InvalidInstruction => msg!("Error: Invalid instruction"),
      AppError::IncorrectProgramId => msg!("Error: Incorrect program id"),
      AppError::Overflow => msg!("Error: Operation overflowed"),
    }
  }
}

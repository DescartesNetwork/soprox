use num_derive::FromPrimitive as DeriveFromPrimitive;
use num_traits::FromPrimitive;
use solana_program::{
  decode_error::DecodeError,
  info,
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
  #[error("Invalid owner")]
  InvalidOwner,
  #[error("Incorrect program id")]
  IncorrectProgramId,
  #[error("Incorrect token id")]
  IncorrectTokenId,
  #[error("Already constructed")]
  ConstructorOnce,
  #[error("Not yet initialized")]
  NotInitialized,
  #[error("Operation overflowed")]
  Overflow,
  #[error("Wrapper unmatched")]
  UnmatchedWrapper,
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
      AppError::InvalidInstruction => info!("Error: Invalid instruction"),
      AppError::InvalidOwner => info!("Error: Invalid owner"),
      AppError::IncorrectProgramId => info!("Error: Incorrect program id"),
      AppError::IncorrectTokenId => info!("Error: Incorrect token id"),
      AppError::ConstructorOnce => info!("Error: Already constructed"),
      AppError::NotInitialized => info!("Error: Not yet initialized"),
      AppError::Overflow => info!("Error: Operation overflowed"),
      AppError::UnmatchedWrapper => info!("Error: Wrapper unmatched"),
    }
  }
}

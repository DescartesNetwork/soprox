#![cfg(feature = "program")]

use crate::error::AppError;
use solana_sdk::{program_error::ProgramError, pubkey::Pubkey};
use std::convert::TryInto;

#[repr(C)]
#[derive(Clone, Debug, PartialEq)]
pub enum AppInstruction {
  Transfer { amount: u64 },
  TransferOwnership { new_owner: Pubkey },
}

impl AppInstruction {
  pub fn unpack(instruction: &[u8]) -> Result<Self, ProgramError> {
    let (&tag, rest) = instruction
      .split_first()
      .ok_or(AppError::InvalidInstruction)?;
    Ok(match tag {
      0 => {
        let new_owner = rest
          .get(..32)
          .and_then(|slice| slice.try_into().ok())
          .map(Pubkey::new_from_array)
          .ok_or(AppError::InvalidInstruction)?;
        Self::TransferOwnership { new_owner }
      }
      3 => {
        let amount = rest
          .get(..8)
          .and_then(|slice| slice.try_into().ok())
          .map(u64::from_le_bytes)
          .ok_or(AppError::InvalidInstruction)?;
        Self::Transfer { amount }
      }
      _ => return Err(AppError::InvalidInstruction.into()),
    })
  }
}

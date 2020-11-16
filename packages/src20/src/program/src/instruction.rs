#![cfg(feature = "program")]

use crate::error::AppError;
use solana_sdk::program_error::ProgramError;
use std::{char, convert::TryInto};

#[repr(C)]
#[derive(Clone, Debug, PartialEq)]
pub enum AppInstruction {
  TokenConstructor {
    symbol: [char; 3],
    total_supply: u64,
    decimals: u8,
  },
  AccountConstructor {},
  DelegationConstructor {
    amount: u64,
  },
  Transfer {
    amount: u64,
  },
  Approve {
    amount: u64,
  },
  TransferFrom {
    amount: u64,
  },
}

impl AppInstruction {
  pub fn unpack(instruction: &[u8]) -> Result<Self, ProgramError> {
    let (&tag, rest) = instruction
      .split_first()
      .ok_or(AppError::InvalidInstruction)?;
    Ok(match tag {
      // Token contructor
      0 => {
        let first_symbol = rest
          .get(..4)
          .and_then(|slice| slice.try_into().ok())
          .map(u32::from_le_bytes)
          .and_then(char::from_u32)
          .ok_or(AppError::InvalidInstruction)?;
        let second_symbol = rest
          .get(4..8)
          .and_then(|slice| slice.try_into().ok())
          .map(u32::from_le_bytes)
          .and_then(char::from_u32)
          .ok_or(AppError::InvalidInstruction)?;
        let third_symbol = rest
          .get(8..12)
          .and_then(|slice| slice.try_into().ok())
          .map(u32::from_le_bytes)
          .and_then(char::from_u32)
          .ok_or(AppError::InvalidInstruction)?;
        let total_supply = rest
          .get(12..20)
          .and_then(|slice| slice.try_into().ok())
          .map(u64::from_le_bytes)
          .ok_or(AppError::InvalidInstruction)?;
        let decimals = rest
          .get(20..21)
          .and_then(|slice| slice.try_into().ok())
          .map(u8::from_le_bytes)
          .ok_or(AppError::InvalidInstruction)?;
        Self::TokenConstructor {
          symbol: [first_symbol, second_symbol, third_symbol],
          total_supply,
          decimals,
        }
      }
      // Account constructor
      1 => Self::AccountConstructor {},
      // Delegation constructor
      2 => {
        let amount = rest
          .get(..8)
          .and_then(|slice| slice.try_into().ok())
          .map(u64::from_le_bytes)
          .ok_or(AppError::InvalidInstruction)?;
        Self::DelegationConstructor { amount }
      }
      // Token operation
      3 | 4 | 5 => {
        let amount = rest
          .get(..8)
          .and_then(|slice| slice.try_into().ok())
          .map(u64::from_le_bytes)
          .ok_or(AppError::InvalidInstruction)?;
        match tag {
          // Transfer
          3 => Self::Transfer { amount },
          // Approve
          4 => Self::Approve { amount },
          // TransferFrom
          5 => Self::TransferFrom { amount },
          // Error
          _ => unreachable!(),
        }
      }
      _ => return Err(AppError::InvalidInstruction.into()),
    })
  }
}

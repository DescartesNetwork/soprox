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
  Revoke,
}

impl AppInstruction {
  pub fn unpack(instruction: &[u8]) -> Result<Self, ProgramError> {
    let (&tag, rest) = instruction
      .split_first()
      .ok_or(AppError::InvalidInstruction)?;
    Ok(match tag {
      // Token contructor
      0 => {
        let vec_symbol: Vec<_> = rest
          .get(..12)
          .unwrap()
          .chunks(4)
          .map(|slice| slice.try_into().unwrap())
          .map(|slice| u32::from_le_bytes(slice))
          .map(|slice| char::from_u32(slice).unwrap())
          .collect();
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
          symbol: [vec_symbol[0], vec_symbol[1], vec_symbol[2]],
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
      // Transfer, Approve, TransferFrom
      3 | 4 | 5 => {
        let amount = rest
          .get(..8)
          .and_then(|slice| slice.try_into().ok())
          .map(u64::from_le_bytes)
          .ok_or(AppError::InvalidInstruction)?;
        match tag {
          3 => Self::Transfer { amount },
          4 => Self::Approve { amount },
          5 => Self::TransferFrom { amount },
          _ => unreachable!(),
        }
      }
      // Revoke
      6 => Self::Revoke {},
      _ => return Err(AppError::InvalidInstruction.into()),
    })
  }
}

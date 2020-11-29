#![cfg(feature = "program")]

use crate::error::AppError;
use solana_sdk::program_error::ProgramError;
use std::{char, convert::TryInto};

#[repr(C)]
#[derive(Clone, Debug, PartialEq)]
pub enum AppInstruction {
  TokenConstructor {
    symbol: [char; 4],
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
  IncreaseApproval {
    amount: u64,
  },
  DecreaseApproval {
    amount: u64,
  },
  Revoke {},
  AccountDestruction {},
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
          .get(..16)
          .unwrap()
          .chunks(4)
          .map(|slice| slice.try_into().unwrap())
          .map(|slice| u32::from_le_bytes(slice))
          .map(|slice| char::from_u32(slice).unwrap())
          .collect();
        let total_supply = rest
          .get(16..24)
          .and_then(|slice| slice.try_into().ok())
          .map(u64::from_le_bytes)
          .ok_or(AppError::InvalidInstruction)?;
        let decimals = rest
          .get(24..25)
          .and_then(|slice| slice.try_into().ok())
          .map(u8::from_le_bytes)
          .ok_or(AppError::InvalidInstruction)?;
        Self::TokenConstructor {
          symbol: [vec_symbol[0], vec_symbol[1], vec_symbol[2], vec_symbol[3]],
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
      // Transfer, Approve, TransferFrom, IncreaseApproval, DecreaseApproval
      3 | 4 | 5 | 6 | 7 => {
        let amount = rest
          .get(..8)
          .and_then(|slice| slice.try_into().ok())
          .map(u64::from_le_bytes)
          .ok_or(AppError::InvalidInstruction)?;
        match tag {
          3 => Self::Transfer { amount },
          4 => Self::Approve { amount },
          5 => Self::TransferFrom { amount },
          6 => Self::IncreaseApproval { amount },
          7 => Self::DecreaseApproval { amount },
          _ => unreachable!(),
        }
      }
      // Revoke
      8 => Self::Revoke {},
      // Destruct
      9 => Self::AccountDestruction {},
      _ => return Err(AppError::InvalidInstruction.into()),
    })
  }
}

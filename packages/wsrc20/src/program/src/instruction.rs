use crate::error::AppError;
use solana_program::program_error::ProgramError;
use std::{char, convert::TryInto};

#[derive(Clone, Debug, PartialEq)]
pub enum AppInstruction {
  Constructor { symbol: [char; 4] },
  Wrap { amount: u64 },
  Unwrap { amount: u64 },
}
impl AppInstruction {
  pub fn unpack(instruction: &[u8]) -> Result<Self, ProgramError> {
    let (&tag, rest) = instruction
      .split_first()
      .ok_or(AppError::InvalidInstruction)?;
    Ok(match tag {
      0 => {
        let vec_symbol: Vec<_> = rest
          .get(..16)
          .unwrap()
          .chunks(4)
          .map(|slice| slice.try_into().unwrap())
          .map(|slice| u32::from_le_bytes(slice))
          .map(|slice| char::from_u32(slice).unwrap())
          .collect();
        Self::Constructor {
          symbol: [vec_symbol[0], vec_symbol[1], vec_symbol[2], vec_symbol[3]],
        }
      }
      1 | 2 => {
        let amount = rest
          .get(..8)
          .and_then(|slice| slice.try_into().ok())
          .map(u64::from_le_bytes)
          .ok_or(AppError::InvalidInstruction)?;
        match tag {
          1 => Self::Wrap { amount },
          2 => Self::Unwrap { amount },
          _ => unreachable!(),
        }
      }
      _ => return Err(AppError::InvalidInstruction.into()),
    })
  }
}

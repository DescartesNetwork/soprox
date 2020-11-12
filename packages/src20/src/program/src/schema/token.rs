#![cfg(feature = "program")]

use arrayref::{array_mut_ref, array_ref, array_refs, mut_array_refs};
use solana_sdk::{
  program_error::ProgramError,
  program_pack::{IsInitialized, Pack, Sealed},
};

//
// Define the data struct
//
#[repr(C)]
#[derive(Clone, Copy, Debug, Default, PartialEq)]
pub struct Token {
  pub total_supply: u64,
  pub decimals: u8,
  pub initialized: bool,
}

//
// Implement Sealed trait
//
impl Sealed for Token {}

//
// Implement IsInitialized trait
//
impl IsInitialized for Token {
  fn is_initialized(&self) -> bool {
    true
  }
}

//
// Implement Pack trait
//
impl Pack for Token {
  // Fixed length
  const LEN: usize = 8 + 1 + 1;
  // Unpack data from [u8] to the data struct
  fn unpack_from_slice(src: &[u8]) -> Result<Self, ProgramError> {
    let src = array_ref![src, 0, 10];
    let (total_supply, decimals, initialized) = array_refs![src, 8, 1, 1];
    let _initialized = match initialized {
      [0] => false,
      [1] => true,
      _ => return Err(ProgramError::InvalidAccountData),
    };
    Ok(Token {
      total_supply: u64::from_le_bytes(*total_supply),
      decimals: u8::from_le_bytes(*decimals),
      initialized: _initialized,
    })
  }
  // Pack data from the data struct to [u8]
  fn pack_into_slice(&self, dst: &mut [u8]) {
    let dst = array_mut_ref![dst, 0, 10];
    let (dst_total_supply, dst_decimals, dst_initialized) = mut_array_refs![dst, 8, 1, 1];
    let &Token {
      total_supply,
      decimals,
      initialized,
    } = self;
    *dst_total_supply = total_supply.to_le_bytes();
    *dst_decimals = decimals.to_le_bytes();
    *dst_initialized = match initialized {
      true => [1],
      _ => [0],
    };
  }
}

#![cfg(feature = "program")]

use arrayref::{array_mut_ref, array_ref, array_refs, mut_array_refs};
use solana_sdk::{
  program_error::ProgramError,
  program_pack::{IsInitialized, Pack, Sealed},
};
use std::char;

//
// Define the data struct
//
#[repr(C)]
#[derive(Clone, Copy, Debug, Default, PartialEq)]
pub struct Token {
  pub symbol: [char; 3],
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
    self.initialized
  }
}

//
// Implement Pack trait
//
impl Pack for Token {
  // Fixed length
  const LEN: usize = 4 * 3 + 8 + 1 + 1;
  // Unpack data from [u8] to the data struct
  fn unpack_from_slice(src: &[u8]) -> Result<Self, ProgramError> {
    let src = array_ref![src, 0, 22];
    let (symbol, total_supply, decimals, initialized) = array_refs![src, 12, 8, 1, 1];
    let (first_sym, second_sym, third_sym) = array_refs!(symbol, 4, 4, 4);
    let [_fs, _ss, _ts] = [
      u32::from_le_bytes(*first_sym),
      u32::from_le_bytes(*second_sym),
      u32::from_le_bytes(*third_sym),
    ];
    Ok(Token {
      symbol: [
        char::from_u32(_fs).unwrap(),
        char::from_u32(_ss).unwrap(),
        char::from_u32(_ts).unwrap(),
      ],
      total_supply: u64::from_le_bytes(*total_supply),
      decimals: u8::from_le_bytes(*decimals),
      initialized: match initialized {
        [0] => false,
        [1] => true,
        _ => return Err(ProgramError::InvalidAccountData),
      },
    })
  }
  // Pack data from the data struct to [u8]
  fn pack_into_slice(&self, dst: &mut [u8]) {
    let dst = array_mut_ref![dst, 0, 22];
    let (dst_symbol, dst_total_supply, dst_decimals, dst_initialized) =
      mut_array_refs![dst, 12, 8, 1, 1];
    let (dst_first_sym, dst_second_sym, dst_third_sym) = mut_array_refs!(dst_symbol, 4, 4, 4);
    let &Token {
      symbol: [first_sym, second_sym, third_sym],
      total_supply,
      decimals,
      initialized,
    } = self;
    first_sym.encode_utf8(dst_first_sym);
    second_sym.encode_utf8(dst_second_sym);
    third_sym.encode_utf8(dst_third_sym);
    *dst_total_supply = total_supply.to_le_bytes();
    *dst_decimals = decimals.to_le_bytes();
    *dst_initialized = [initialized as u8];
  }
}

#![cfg(feature = "program")]

use arrayref::{array_mut_ref, array_ref, array_refs, mut_array_refs};
use solana_sdk::{
  program_error::ProgramError,
  program_pack::{IsInitialized, Pack, Sealed},
};

//
// Define the data struct
//
#[derive(Clone, Copy, Debug, Default, PartialEq)]
pub struct Dummy {
  pub amount: u64,
}

//
// Implement Sealed trait
//
impl Sealed for Dummy {}

//
// Implement IsInitialized trait
//
impl IsInitialized for Dummy {
  fn is_initialized(&self) -> bool {
    true
  }
}

//
// Implement Pack trait
//
impl Pack for Dummy {
  // Fixed length
  const LEN: usize = 5;
  // Unpack data from [u8] to the data struct
  fn unpack_from_slice(src: &[u8]) -> Result<Self, ProgramError> {
    let src = array_ref![src, 0, 8];
    let amount = u64::from_le_bytes(*src);
    Ok(Dummy { amount })
  }
  // Pack data from the data struct to [u8]
  fn pack_into_slice(&self, dst: &mut [u8]) {
    let dst = array_mut_ref![dst, 0, 8];
    let &Dummy { amount } = self;
    *dst = amount.to_le_bytes();
  }
}

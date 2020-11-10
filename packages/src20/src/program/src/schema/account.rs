#![cfg(feature = "program")]

use arrayref::{array_mut_ref, array_ref, array_refs, mut_array_refs};
use solana_sdk::{
  program_error::ProgramError,
  program_pack::{IsInitialized, Pack, Sealed},
  pubkey::Pubkey,
};

//
// Define the data struct
//
#[repr(C)]
#[derive(Clone, Copy, Debug, Default, PartialEq)]
pub struct Account {
  pub owner: Pubkey,
  pub amount: u64,
}

//
// Implement Sealed trait
//
impl Sealed for Account {}

//
// Implement IsInitialized trait
//
impl IsInitialized for Account {
  fn is_initialized(&self) -> bool {
    true
  }
}

//
// Implement Pack trait
//
impl Pack for Account {
  // Fixed length
  const LEN: usize = 32 + 8;
  // Unpack data from [u8] to the data struct
  fn unpack_from_slice(src: &[u8]) -> Result<Self, ProgramError> {
    let src = array_ref![src, 0, 40];
    let (owner, amount) = array_refs![src, 32, 8];
    Ok(Account {
      owner: Pubkey::new_from_array(*owner),
      amount: u64::from_le_bytes(*amount),
    })
  }
  // Pack data from the data struct to [u8]
  fn pack_into_slice(&self, dst: &mut [u8]) {
    let dst = array_mut_ref![dst, 0, 40];
    let (dst_owner, dst_amount) = mut_array_refs![dst, 32, 8];
    let &Account { ref owner, amount } = self;
    dst_owner.copy_from_slice(owner.as_ref());
    *dst_amount = amount.to_le_bytes();
  }
}

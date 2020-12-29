use solana_program::{
  instruction::{AccountMeta, Instruction},
  program_error::ProgramError,
  pubkey::Pubkey,
};
use std::mem::size_of;

pub struct ISPL {}

impl ISPL {
  pub fn transfer (
    program_id: Pubkey,
    amount: u64,
    src: Pubkey,
    dst: Pubkey,
  ) -> Result<Instruction, ProgramError> {
    // Build data
    let mut data = Vec::with_capacity(size_of::<Self>());
    // Transfer - Code 1
    data.push(1);
    data.extend_from_slice(&amount.to_le_bytes());
    // Build accounts
    let mut accounts = Vec::with_capacity(2);
    accounts.push(AccountMeta::new(src, true));
    accounts.push(AccountMeta::new(dst, false));
    // Return
    Ok(Instruction {
      program_id,
      accounts,
      data,
    })
  }
}
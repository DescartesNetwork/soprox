use solana_program::{
  instruction::{AccountMeta, Instruction},
  program_error::ProgramError,
  pubkey::Pubkey,
};
use std::mem::size_of;

pub struct ISPL {}

impl ISPL {
  pub fn initialize_account(
    program_id: Pubkey,
    owner: Pubkey,
    token_acc: Pubkey,
    target_acc: Pubkey,
    sysvar_rent_acc: Pubkey,
  ) -> Result<Instruction, ProgramError> {
    // Build data
    let mut data = Vec::with_capacity(size_of::<Self>());
    // InitializeAccount - Code 1
    data.push(1);
    // Build accounts
    let mut accounts = Vec::with_capacity(4);
    accounts.push(AccountMeta::new(target_acc, false));
    accounts.push(AccountMeta::new_readonly(token_acc, false));
    accounts.push(AccountMeta::new_readonly(owner, false));
    accounts.push(AccountMeta::new_readonly(sysvar_rent_acc, false));
    // Return
    Ok(Instruction {
      program_id,
      accounts,
      data,
    })
  }
  pub fn transfer(
    program_id: Pubkey,
    owner: Pubkey,
    src_acc: Pubkey,
    dst_acc: Pubkey,
    amount: u64,
  ) -> Result<Instruction, ProgramError> {
    // Build data
    let mut data = Vec::with_capacity(size_of::<Self>());
    // Transfer - Code 3
    data.push(3);
    data.extend_from_slice(&amount.to_le_bytes());
    // Build accounts
    let mut accounts = Vec::with_capacity(3);
    accounts.push(AccountMeta::new(src_acc, false));
    accounts.push(AccountMeta::new(dst_acc, false));
    accounts.push(AccountMeta::new_readonly(owner, true));
    // Return
    Ok(Instruction {
      program_id,
      accounts,
      data,
    })
  }
}

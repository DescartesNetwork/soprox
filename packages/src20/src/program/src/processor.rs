#![cfg(feature = "program")]

use crate::error::AppError;
use crate::instruction::AppInstruction;
use crate::schema::account::Account;
use solana_sdk::{
  account_info::{next_account_info, AccountInfo},
  entrypoint::ProgramResult,
  info,
  program_pack::Pack,
  pubkey::Pubkey,
};

pub struct Processor {}

impl Processor {
  pub fn process(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
  ) -> ProgramResult {
    let instruction = AppInstruction::unpack(instruction_data)?;
    match instruction {
      AppInstruction::TransferOwnership { new_owner } => {
        info!("Calling TransferOwnership function");
        let accounts_iter = &mut accounts.iter();
        // Extract account
        let acc = next_account_info(accounts_iter)?;
        if acc.owner != program_id {
          return Err(AppError::IncorrectProgramId.into());
        }
        // Verify owner & signer
        if !acc.is_signer {
          return Err(AppError::InvalidOwner.into());
        }
        // Extract and change account data
        let mut data = Account::unpack(&acc.data.borrow())?;
        data.owner = new_owner;
        Account::pack(data, &mut acc.data.borrow_mut())?;
        Ok(())
      }
      AppInstruction::Transfer { amount } => {
        info!("Calling Transfer function");
        // Extract accounts: signer, source, destination
        let accounts_iter = &mut accounts.iter();
        let signer = next_account_info(accounts_iter)?;
        let src_acc = next_account_info(accounts_iter)?;
        if src_acc.owner != program_id {
          return Err(AppError::IncorrectProgramId.into());
        }
        let dst_acc = next_account_info(accounts_iter)?;
        if dst_acc.owner != program_id {
          return Err(AppError::IncorrectProgramId.into());
        }
        // Extract accounts data
        let mut src_data = Account::unpack(&src_acc.data.borrow())?;
        let mut dst_data = Account::unpack(&dst_acc.data.borrow())?;
        // Verify source owner
        if *signer.key != src_data.owner {
          return Err(AppError::InvalidOwner.into());
        }
        // From
        src_data.amount = src_data
          .amount
          .checked_sub(amount)
          .ok_or(AppError::Overflow)?;
        Account::pack(src_data, &mut src_acc.data.borrow_mut())?;
        // To
        dst_data.amount = dst_data
          .amount
          .checked_add(amount)
          .ok_or(AppError::Overflow)?;
        Account::pack(dst_data, &mut dst_acc.data.borrow_mut())?;
        Ok(())
      }
    }
  }
}

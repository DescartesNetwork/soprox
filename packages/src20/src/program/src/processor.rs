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
        info!(&src_data.owner.to_string());

        // From
        src_data.amount = src_data
          .amount
          .checked_add(amount)
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

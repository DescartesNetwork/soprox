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
use std::mem;

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
        let accounts_iter = &mut accounts.iter();
        let src_acc = next_account_info(accounts_iter)?;
        if src_acc.owner != program_id {
          return Err(AppError::IncorrectProgramId.into());
        }
        let dst_acc = next_account_info(accounts_iter)?;
        if dst_acc.owner != program_id {
          return Err(AppError::IncorrectProgramId.into());
        }
        info!(&amount.to_string());
        // let mut data = Dummy::unpack(&account.data.borrow())?;
        // data.amount += amount;
        // data.toggle = toggle;
        // Dummy::pack(data, &mut account.data.borrow_mut())?;
        Ok(())
      }
    }
  }
}

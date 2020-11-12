#![cfg(feature = "program")]

use crate::error::AppError;
use crate::instruction::AppInstruction;
use crate::schema::{account::Account, token::Token};
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
      //
      // Token constructor
      //
      AppInstruction::Constructor {
        total_supply,
        decimals,
      } => {
        info!("Calling Contructor function");
        let accounts_iter = &mut accounts.iter();
        // Extract owner & constructor account
        let cons_acc = next_account_info(accounts_iter)?;
        if cons_acc.owner != program_id {
          return Err(AppError::IncorrectProgramId.into());
        }
        if !cons_acc.is_signer {
          return Err(AppError::InvalidOwner.into());
        }
        let dst_acc = next_account_info(accounts_iter)?;
        if dst_acc.owner != program_id {
          return Err(AppError::IncorrectProgramId.into());
        }
        // Write contructor data
        let mut cons_data = Token::unpack(&cons_acc.data.borrow())?;
        if cons_data.initialized {
          return Err(AppError::ContructorOnce.into());
        }
        cons_data.total_supply = total_supply;
        cons_data.decimals = decimals;
        cons_data.initialized = true;
        Token::pack(cons_data, &mut cons_acc.data.borrow_mut())?;
        // Write destination data
        let mut dst_data = Account::unpack(&dst_acc.data.borrow())?;
        dst_data.amount = dst_data
          .amount
          .checked_add(total_supply)
          .ok_or(AppError::Overflow)?;
        Account::pack(dst_data, &mut dst_acc.data.borrow_mut())?;
        Ok(())
      }

      //
      // Transfer account (wallet) ownership
      //
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

      //
      // Transfer token
      //
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
        if src_acc.key == dst_acc.key {
          return Ok(());
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

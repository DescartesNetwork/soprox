#![cfg(feature = "program")]

use crate::error::AppError;
use crate::instruction::AppInstruction;
use crate::schema::{account::Account, token::Token};
use solana_sdk::{
  account_info::{next_account_info, AccountInfo},
  entrypoint::ProgramResult,
  info,
  program_pack::{IsInitialized, Pack},
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
      AppInstruction::TokenConstructor {
        total_supply,
        decimals,
      } => {
        info!("Calling TokenContructor function");
        let accounts_iter = &mut accounts.iter();
        // Extract owner & constructor account
        let deployer = next_account_info(accounts_iter)?;
        let token_acc = next_account_info(accounts_iter)?;
        let dst_acc = next_account_info(accounts_iter)?;
        if token_acc.owner != program_id || dst_acc.owner != program_id {
          return Err(AppError::IncorrectProgramId.into());
        }
        if !deployer.is_signer || !token_acc.is_signer || !dst_acc.is_signer {
          return Err(AppError::InvalidOwner.into());
        }
        // Write contructor data
        let mut token_data = Token::unpack_unchecked(&token_acc.data.borrow())?;
        let mut dst_data = Account::unpack_unchecked(&dst_acc.data.borrow())?;
        if token_data.is_initialized() || dst_data.is_initialized() {
          return Err(AppError::ConstructorOnce.into());
        }
        // Token
        token_data.total_supply = total_supply;
        token_data.decimals = decimals;
        token_data.initialized = true;
        Token::pack(token_data, &mut token_acc.data.borrow_mut())?;
        // Account
        dst_data.owner = *deployer.key;
        dst_data.token = *token_acc.key;
        dst_data.amount = dst_data
          .amount
          .checked_add(total_supply)
          .ok_or(AppError::Overflow)?;
        dst_data.initialized = true;
        Account::pack(dst_data, &mut dst_acc.data.borrow_mut())?;
        Ok(())
      }

      //
      // Account constructor
      //
      AppInstruction::AccountConstructor {} => {
        info!("Calling AccountConstructor function");
        // Extract accounts: caller, token, target
        let accounts_iter = &mut accounts.iter();
        let caller = next_account_info(accounts_iter)?;
        let token_acc = next_account_info(accounts_iter)?;
        let target_acc = next_account_info(accounts_iter)?;
        if token_acc.owner != program_id || target_acc.owner != program_id {
          return Err(AppError::IncorrectProgramId.into());
        }
        if !caller.is_signer || !target_acc.is_signer {
          return Err(AppError::InvalidOwner.into());
        }
        // Extract and change account data
        let token_data = Token::unpack(&token_acc.data.borrow())?;
        let mut target_data = Account::unpack_unchecked(&target_acc.data.borrow())?;
        if !token_data.is_initialized() {
          return Err(AppError::NotInitialized.into());
        }
        if target_data.is_initialized() {
          return Err(AppError::ConstructorOnce.into());
        }
        target_data.owner = *caller.key;
        target_data.token = *token_acc.key;
        target_data.amount = 0;
        target_data.initialized = true;
        Account::pack(target_data, &mut target_acc.data.borrow_mut())?;
        Ok(())
      }

      //
      // Transfer token
      //
      AppInstruction::Transfer { amount } => {
        info!("Calling Transfer function");
        // Extract accounts: caller, token, source, destination
        let accounts_iter = &mut accounts.iter();
        let caller = next_account_info(accounts_iter)?;
        let token_acc = next_account_info(accounts_iter)?;
        let src_acc = next_account_info(accounts_iter)?;
        let dst_acc = next_account_info(accounts_iter)?;
        if token_acc.owner != program_id
          || src_acc.owner != program_id
          || dst_acc.owner != program_id
        {
          return Err(AppError::IncorrectProgramId.into());
        }
        // Extract accounts data
        let token_data = Token::unpack(&token_acc.data.borrow())?;
        let mut src_data = Account::unpack(&src_acc.data.borrow())?;
        let mut dst_data = Account::unpack(&dst_acc.data.borrow())?;
        if !token_data.is_initialized() || !src_data.is_initialized() || !dst_data.is_initialized()
        {
          return Err(AppError::NotInitialized.into());
        }
        if src_data.token != *token_acc.key || dst_data.token != *token_acc.key {
          return Err(AppError::IncorrectTokenId.into());
        }
        if *caller.key != src_data.owner {
          return Err(AppError::InvalidOwner.into());
        }
        if *src_acc.key == *dst_acc.key {
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

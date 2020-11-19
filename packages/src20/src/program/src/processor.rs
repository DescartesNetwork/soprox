#![cfg(feature = "program")]

use crate::error::AppError;
use crate::instruction::AppInstruction;
use crate::schema::{account::Account, delegation::Delegation, token::Token};
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
      // Token constructor, code 0
      //
      AppInstruction::TokenConstructor {
        symbol,
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
        token_data.symbol = symbol;
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
      // Account constructor, code 1
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
      // Delegation constructor, code 2
      //
      AppInstruction::DelegationConstructor { amount: _ } => {
        info!("Calling DelegationConstructor function");
        Ok(())
      }

      //
      // Transfer token, code 3
      //
      AppInstruction::Transfer { amount } => {
        info!("Calling Transfer function");
        // Extract accounts: owner, token, source, destination
        let accounts_iter = &mut accounts.iter();
        let owner = next_account_info(accounts_iter)?;
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
        if !owner.is_signer || *owner.key != src_data.owner {
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

      //
      // Approve a delegation, code 4
      //
      AppInstruction::Approve { amount } => {
        info!("Calling Approve function");
        // Extract accounts: owner, token, delegation, source, delegate
        let accounts_iter = &mut accounts.iter();
        let owner = next_account_info(accounts_iter)?;
        let token_acc = next_account_info(accounts_iter)?;
        let delegation_acc = next_account_info(accounts_iter)?;
        let src_acc = next_account_info(accounts_iter)?;
        let dlg_acc = next_account_info(accounts_iter)?;
        if token_acc.owner != program_id
          || delegation_acc.owner != program_id
          || src_acc.owner != program_id
        {
          return Err(AppError::IncorrectProgramId.into());
        }
        // Extract accounts data
        let token_data = Token::unpack(&token_acc.data.borrow())?;
        let mut delegation_data = Delegation::unpack_unchecked(&delegation_acc.data.borrow())?;
        let src_data = Account::unpack(&src_acc.data.borrow())?;
        if !token_data.is_initialized() || !src_data.is_initialized() {
          return Err(AppError::NotInitialized.into());
        }
        if delegation_data.is_initialized() {
          return Err(AppError::ConstructorOnce.into());
        }
        if src_data.token != *token_acc.key {
          return Err(AppError::IncorrectTokenId.into());
        }
        if !owner.is_signer || !delegation_acc.is_signer || *owner.key != src_data.owner {
          return Err(AppError::InvalidOwner.into());
        }
        delegation_data.owner = *owner.key;
        delegation_data.token = *token_acc.key;
        delegation_data.source = *src_acc.key;
        delegation_data.delegate = *dlg_acc.key;
        delegation_data.amount = amount;
        delegation_data.initialized = true;
        Delegation::pack(delegation_data, &mut delegation_acc.data.borrow_mut())?;
        Ok(())
      }

      //
      // Delegation constructor, code 5
      //
      AppInstruction::TransferFrom { amount } => {
        info!("Calling TransferFrom function");
        // Extract accounts: delegate, token, delegation, source, destination
        let accounts_iter = &mut accounts.iter();
        let delegate = next_account_info(accounts_iter)?;
        let token_acc = next_account_info(accounts_iter)?;
        let delegation_acc = next_account_info(accounts_iter)?;
        let src_acc = next_account_info(accounts_iter)?;
        let dst_acc = next_account_info(accounts_iter)?;
        if token_acc.owner != program_id
          || delegation_acc.owner != program_id
          || src_acc.owner != program_id
          || dst_acc.owner != program_id
        {
          return Err(AppError::IncorrectProgramId.into());
        }
        // Extract accounts data
        let token_data = Token::unpack(&token_acc.data.borrow())?;
        let mut delegation_data = Delegation::unpack_unchecked(&delegation_acc.data.borrow())?;
        let mut src_data = Account::unpack(&src_acc.data.borrow())?;
        let mut dst_data = Account::unpack(&dst_acc.data.borrow())?;
        if !token_data.is_initialized()
          || !delegation_data.is_initialized()
          || !src_data.is_initialized()
          || !dst_data.is_initialized()
        {
          return Err(AppError::NotInitialized.into());
        }
        if delegation_data.token != *token_acc.key
          || src_data.token != *token_acc.key
          || dst_data.token != *token_acc.key
        {
          return Err(AppError::IncorrectTokenId.into());
        }
        if !delegate.is_signer || *delegate.key != delegation_data.delegate {
          return Err(AppError::InvalidOwner.into());
        }
        if *src_acc.key == *dst_acc.key {
          return Ok(());
        }
        // Delegation
        delegation_data.amount = delegation_data
          .amount
          .checked_sub(amount)
          .ok_or(AppError::Overflow)?;
        Delegation::pack(delegation_data, &mut delegation_acc.data.borrow_mut())?;
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

      //
      // Revoke a delegation, code 6
      //
      AppInstruction::Revoke {} => {
        info!("Calling Revoke function");
        let accounts_iter = &mut accounts.iter();
        let owner = next_account_info(accounts_iter)?;
        let token_acc = next_account_info(accounts_iter)?;
        let delegation_acc = next_account_info(accounts_iter)?;
        if token_acc.owner != program_id || delegation_acc.owner != program_id {
          return Err(AppError::IncorrectProgramId.into());
        }
        // Extract accounts data
        let mut delegation_data = Delegation::unpack(&delegation_acc.data.borrow())?;
        if !delegation_data.is_initialized() {
          return Err(AppError::NotInitialized.into());
        }
        if delegation_data.token != *token_acc.key {
          return Err(AppError::IncorrectTokenId.into());
        }
        if !owner.is_signer || *owner.key != delegation_data.owner {
          return Err(AppError::InvalidOwner.into());
        }

        let balance = owner.lamports();
        **owner.lamports.borrow_mut() = balance
          .checked_add(delegation_acc.lamports())
          .ok_or(AppError::Overflow)?;
        **delegation_acc.lamports.borrow_mut() = 0;
        delegation_data.amount = 0;
        Delegation::pack(delegation_data, &mut delegation_acc.data.borrow_mut())?;
        Ok(())
      }
    }
  }
}

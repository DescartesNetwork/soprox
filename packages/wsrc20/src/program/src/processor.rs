use crate::error::AppError;
use crate::instruction::AppInstruction;
use crate::interfaces::{ispl::ISPL, isrc20::ISRC20};
use crate::schema::{mint::Mint, wrapper::Wrapper};
use solana_program::{
  account_info::{next_account_info, AccountInfo},
  entrypoint::ProgramResult,
  info,
  program::{invoke, invoke_signed},
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
      AppInstruction::Constructor { symbol } => {
        info!("Calling Constructor function");
        let accounts_iter = &mut accounts.iter();
        let wrapper_acc = next_account_info(accounts_iter)?;
        let token_owner_acc = next_account_info(accounts_iter)?; // For both types
        let src20_treasury_acc = next_account_info(accounts_iter)?;
        let src20_token_acc = next_account_info(accounts_iter)?;
        let src20_token_program = next_account_info(accounts_iter)?;
        let spl_treasury_acc = next_account_info(accounts_iter)?;
        let spl_token_acc = next_account_info(accounts_iter)?;
        let spl_token_program = next_account_info(accounts_iter)?;
        let sysvar_rent_acc = next_account_info(accounts_iter)?;
        if wrapper_acc.owner != program_id {
          return Err(AppError::IncorrectProgramId.into());
        }

        let seed: &[&[_]] = &[&wrapper_acc.key.to_bytes()[..]];
        let token_owner_key = Pubkey::create_program_address(&seed, program_id)?;
        if !wrapper_acc.is_signer || token_owner_key != *token_owner_acc.key {
          return Err(AppError::InvalidOwner.into());
        }
        let mut wrapper_data = Wrapper::unpack_unchecked(&wrapper_acc.data.borrow())?;
        if wrapper_data.is_initialized() {
          return Err(AppError::ConstructorOnce.into());
        }
        let spl_token_data = Mint::unpack(&spl_token_acc.data.borrow())?;

        let token_constructor_ix = ISRC20::token_constructor(
          *src20_token_program.key,
          token_owner_key,
          *src20_token_acc.key,
          *src20_treasury_acc.key,
          symbol,
          spl_token_data.supply,
          spl_token_data.decimals,
        )?;
        invoke_signed(
          &token_constructor_ix,
          &[
            src20_token_program.clone(),
            token_owner_acc.clone(),
            src20_token_acc.clone(),
            src20_treasury_acc.clone(),
          ],
          &[&seed],
        )?;

        let initialize_account_ix = ISPL::initialize_account(
          *spl_token_program.key,
          token_owner_key,
          *spl_token_acc.key,
          *spl_treasury_acc.key,
          *sysvar_rent_acc.key,
        )?;
        invoke(
          &initialize_account_ix,
          &[
            spl_token_program.clone(),
            token_owner_acc.clone(),
            spl_token_acc.clone(),
            spl_treasury_acc.clone(),
            sysvar_rent_acc.clone(),
          ],
        )?;

        // Add wrapper data
        wrapper_data.src20_treasury = *src20_treasury_acc.key;
        wrapper_data.src20_token = *src20_token_acc.key;
        wrapper_data.spl_treasury = *spl_treasury_acc.key;
        wrapper_data.spl_token = *spl_token_acc.key;
        wrapper_data.initialized = true;
        Wrapper::pack(wrapper_data, &mut wrapper_acc.data.borrow_mut())?;

        Ok(())
      }

      AppInstruction::Wrap { amount } => {
        info!("Calling Wrap function");
        let accounts_iter = &mut accounts.iter();
        let owner = next_account_info(accounts_iter)?;
        let src_acc = next_account_info(accounts_iter)?;
        let dst_acc = next_account_info(accounts_iter)?;
        let wrapper_acc = next_account_info(accounts_iter)?;
        let token_owner_acc = next_account_info(accounts_iter)?; // For both types
        let src20_treasury_acc = next_account_info(accounts_iter)?;
        let src20_token_acc = next_account_info(accounts_iter)?;
        let src20_token_program = next_account_info(accounts_iter)?;
        let spl_treasury_acc = next_account_info(accounts_iter)?;
        let spl_token_acc = next_account_info(accounts_iter)?;
        let spl_token_program = next_account_info(accounts_iter)?;
        if wrapper_acc.owner != program_id {
          return Err(AppError::IncorrectProgramId.into());
        }

        let seed: &[&[_]] = &[&wrapper_acc.key.to_bytes()[..]];
        let token_owner_key = Pubkey::create_program_address(&seed, program_id)?;
        if !owner.is_signer || token_owner_key != *token_owner_acc.key {
          return Err(AppError::InvalidOwner.into());
        }
        let wrapper_data = Wrapper::unpack(&wrapper_acc.data.borrow())?;
        if wrapper_data.src20_treasury != *src20_treasury_acc.key
          || wrapper_data.src20_token != *src20_token_acc.key
          || wrapper_data.spl_treasury != *spl_treasury_acc.key
          || wrapper_data.spl_token != *spl_token_acc.key
        {
          return Err(AppError::UnmatchedWrapper.into());
        }

        let in_ix = ISPL::transfer(
          *spl_token_program.key,
          *owner.key,
          *src_acc.key,
          *spl_treasury_acc.key,
          amount,
        )?;
        invoke(
          &in_ix,
          &[
            spl_token_program.clone(),
            owner.clone(),
            src_acc.clone(),
            spl_treasury_acc.clone(),
          ],
        )?;

        let out_ix = ISRC20::transfer(
          *src20_token_program.key,
          *token_owner_acc.key,
          *src20_token_acc.key,
          *src20_treasury_acc.key,
          *dst_acc.key,
          amount,
        )?;
        invoke_signed(
          &out_ix,
          &[
            src20_token_program.clone(),
            token_owner_acc.clone(),
            src20_token_acc.clone(),
            src20_treasury_acc.clone(),
            dst_acc.clone(),
          ],
          &[&seed],
        )?;

        Ok(())
      }

      AppInstruction::Unwrap { amount } => {
        info!("Calling Unwrap function");
        let accounts_iter = &mut accounts.iter();
        let owner = next_account_info(accounts_iter)?;
        let src_acc = next_account_info(accounts_iter)?;
        let dst_acc = next_account_info(accounts_iter)?;
        let wrapper_acc = next_account_info(accounts_iter)?;
        let token_owner_acc = next_account_info(accounts_iter)?; // For both types
        let src20_treasury_acc = next_account_info(accounts_iter)?;
        let src20_token_acc = next_account_info(accounts_iter)?;
        let src20_token_program = next_account_info(accounts_iter)?;
        let spl_treasury_acc = next_account_info(accounts_iter)?;
        let spl_token_acc = next_account_info(accounts_iter)?;
        let spl_token_program = next_account_info(accounts_iter)?;
        if wrapper_acc.owner != program_id {
          return Err(AppError::IncorrectProgramId.into());
        }

        let seed: &[&[_]] = &[&wrapper_acc.key.to_bytes()[..]];
        let token_owner_key = Pubkey::create_program_address(&seed, program_id)?;
        if !owner.is_signer || token_owner_key != *token_owner_acc.key {
          return Err(AppError::InvalidOwner.into());
        }
        let wrapper_data = Wrapper::unpack(&wrapper_acc.data.borrow())?;
        if wrapper_data.src20_treasury != *src20_treasury_acc.key
          || wrapper_data.src20_token != *src20_token_acc.key
          || wrapper_data.spl_treasury != *spl_treasury_acc.key
          || wrapper_data.spl_token != *spl_token_acc.key
        {
          return Err(AppError::UnmatchedWrapper.into());
        }

        let in_ix = ISRC20::transfer(
          *src20_token_program.key,
          *owner.key,
          *src20_token_acc.key,
          *src_acc.key,
          *src20_treasury_acc.key,
          amount,
        )?;
        invoke(
          &in_ix,
          &[
            src20_token_program.clone(),
            owner.clone(),
            src20_token_acc.clone(),
            src_acc.clone(),
            src20_treasury_acc.clone(),
          ],
        )?;

        let out_ix = ISPL::transfer(
          *spl_token_program.key,
          *token_owner_acc.key,
          *spl_treasury_acc.key,
          *dst_acc.key,
          amount,
        )?;
        invoke_signed(
          &out_ix,
          &[
            spl_token_program.clone(),
            token_owner_acc.clone(),
            spl_treasury_acc.clone(),
            dst_acc.clone(),
          ],
          &[&seed],
        )?;

        Ok(())
      }
    }
  }
}

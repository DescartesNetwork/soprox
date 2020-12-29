use crate::error::AppError;
use crate::instruction::AppInstruction;
use crate::interfaces::isrc20::ISRC20;
use solana_program::{
  account_info::{next_account_info, AccountInfo},
  entrypoint::ProgramResult,
  info,
  program::invoke,
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
      AppInstruction::CallTransfer { amount } => {
        info!("Calling CallTransfer function");
        let accounts_iter = &mut accounts.iter();
        let owner = next_account_info(accounts_iter)?;
        let token_acc = next_account_info(accounts_iter)?;
        let src_acc = next_account_info(accounts_iter)?;
        let dst_acc = next_account_info(accounts_iter)?;
        let token_program_id = next_account_info(accounts_iter)?;

        let ix = ISRC20::transfer(
          *token_program_id.key,
          *owner.key,
          *token_acc.key,
          *src_acc.key,
          *dst_acc.key,
          amount,
        )?;
        invoke(
          &ix,
          &[
            token_program_id.clone(),
            owner.clone(),
            token_acc.clone(),
            src_acc.clone(),
            dst_acc.clone(),
          ],
        )?;
        Ok(())
      }
    }
  }
}

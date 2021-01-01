use arrayref::{array_mut_ref, array_ref, array_refs, mut_array_refs};
use solana_program::{
  program_error::ProgramError,
  program_pack::{IsInitialized, Pack, Sealed},
  pubkey::Pubkey,
};

//
// Define the data struct
//
#[derive(Clone, Copy, Debug, Default, PartialEq)]
pub struct Wrapper {
  pub owner: Pubkey,
  pub src20_treasury: Pubkey,
  pub src20: Pubkey,
  pub spl_treasury: Pubkey,
  pub spl: Pubkey,
  pub initialized: bool,
}

//
// Implement Sealed trait
//
impl Sealed for Wrapper {}

//
// Implement IsInitialized trait
//
impl IsInitialized for Wrapper {
  fn is_initialized(&self) -> bool {
    self.initialized
  }
}

//
// Implement Pack trait
//
impl Pack for Wrapper {
  // Fixed length
  const LEN: usize = 32 * 5 + 1;
  // Unpack data from [u8] to the data struct
  fn unpack_from_slice(src: &[u8]) -> Result<Self, ProgramError> {
    let src = array_ref![src, 0, 161];
    let (owner, src20_treasury, src20, spl_treasury, spl, initialized) =
      array_refs![src, 32, 32, 32, 32, 32, 1];
    Ok(Wrapper {
      owner: Pubkey::new_from_array(*owner),
      src20_treasury: Pubkey::new_from_array(*src20_treasury),
      src20: Pubkey::new_from_array(*src20),
      spl_treasury: Pubkey::new_from_array(*spl_treasury),
      spl: Pubkey::new_from_array(*spl),
      initialized: match initialized {
        [0] => false,
        [1] => true,
        _ => return Err(ProgramError::InvalidAccountData),
      },
    })
  }
  // Pack data from the data struct to [u8]
  fn pack_into_slice(&self, dst: &mut [u8]) {
    let dst = array_mut_ref![dst, 0, 161];
    let (dst_owner, dst_src20_treasury, dst_src20, dst_spl_treasury, dst_spl, dst_initialized) =
      mut_array_refs![dst, 32, 32, 32, 32, 32, 1];
    let &Wrapper {
      ref owner,
      ref src20_treasury,
      ref src20,
      ref spl_treasury,
      ref spl,
      initialized,
    } = self;
    dst_owner.copy_from_slice(owner.as_ref());
    dst_src20_treasury.copy_from_slice(src20_treasury.as_ref());
    dst_src20.copy_from_slice(src20.as_ref());
    dst_spl_treasury.copy_from_slice(spl_treasury.as_ref());
    dst_spl.copy_from_slice(spl.as_ref());
    *dst_initialized = [initialized as u8];
  }
}

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
  pub src20_treasury: Pubkey,
  pub src20_token: Pubkey,
  pub spl_treasury: Pubkey,
  pub spl_token: Pubkey,
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
  const LEN: usize = 32 * 4 + 1;
  // Unpack data from [u8] to the data struct
  fn unpack_from_slice(src: &[u8]) -> Result<Self, ProgramError> {
    let src = array_ref![src, 0, 129];
    let (src20_treasury, src20_token, spl_treasury, spl_token, initialized) =
      array_refs![src, 32, 32, 32, 32, 1];
    Ok(Wrapper {
      src20_treasury: Pubkey::new_from_array(*src20_treasury),
      src20_token: Pubkey::new_from_array(*src20_token),
      spl_treasury: Pubkey::new_from_array(*spl_treasury),
      spl_token: Pubkey::new_from_array(*spl_token),
      initialized: match initialized {
        [0] => false,
        [1] => true,
        _ => return Err(ProgramError::InvalidAccountData),
      },
    })
  }
  // Pack data from the data struct to [u8]
  fn pack_into_slice(&self, dst: &mut [u8]) {
    let dst = array_mut_ref![dst, 0, 129];
    let (dst_src20_treasury, dst_src20_token, dst_spl_treasury, dst_spl_token, dst_initialized) =
      mut_array_refs![dst, 32, 32, 32, 32, 1];
    let &Wrapper {
      ref src20_treasury,
      ref src20_token,
      ref spl_treasury,
      ref spl_token,
      initialized,
    } = self;
    dst_src20_treasury.copy_from_slice(src20_treasury.as_ref());
    dst_src20_token.copy_from_slice(src20_token.as_ref());
    dst_spl_treasury.copy_from_slice(spl_treasury.as_ref());
    dst_spl_token.copy_from_slice(spl_token.as_ref());
    *dst_initialized = [initialized as u8];
  }
}

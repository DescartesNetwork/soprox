use arrayref::{array_mut_ref, array_ref};
use solana_program::{
  program_error::ProgramError,
  program_pack::{IsInitialized, Pack, Sealed},
};

//
// Define the data struct
//
#[derive(Clone, Copy, Debug, Default, PartialEq)]
pub struct Hello {
  pub times: u32,
}

//
// Implement Sealed trait
//
impl Sealed for Hello {}

//
// Implement IsInitialized trait
//
impl IsInitialized for Hello {
  fn is_initialized(&self) -> bool {
    true
  }
}

//
// Implement Pack trait
//
impl Pack for Hello {
  // Fixed length
  const LEN: usize = 4;
  // Unpack data from [u8] to the data struct
  fn unpack_from_slice(src: &[u8]) -> Result<Self, ProgramError> {
    let src_times = array_ref![src, 0, 4];
    let times = u32::from_le_bytes(*src_times);
    Ok(Hello { times })
  }
  // Pack data from the data struct to [u8]
  fn pack_into_slice(&self, dst: &mut [u8]) {
    let dst_times = array_mut_ref![dst, 0, 4];
    let &Hello { times } = self;
    *dst_times = times.to_le_bytes();
  }
}

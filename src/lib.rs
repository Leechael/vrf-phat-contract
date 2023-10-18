#![cfg_attr(not(feature = "std"), no_std, no_main)]
extern crate alloc;

use pink_extension as pink;

#[pink::contract(env=PinkEnvironment)]
#[pink(inner=ink::contract)]
mod minimal_phat_contract {
    use super::pink;
    use pink::PinkEnvironment;
    use this_crate::{version_tuple, VersionTuple};

    #[ink(storage)]
    pub struct Boilerplate {
    }

    ///

    impl Boilerplate {
        #[ink(constructor)]
        pub fn default() -> Self {
            Self {
            }
        }

        #[ink(message)]
        pub fn version(&self) -> VersionTuple {
            version_tuple!()
        }
    }
}

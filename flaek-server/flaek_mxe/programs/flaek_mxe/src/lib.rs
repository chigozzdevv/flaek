// Increase heap size to 256KB for Arcium computations
#[cfg(all(not(feature = "no-entrypoint"), not(test)))]
#[global_allocator]
static ALLOC: BumpAllocator = BumpAllocator {
    start: solana_program::entrypoint::HEAP_START_ADDRESS as usize,
    len: 256 * 1024, // 256KB heap
};

use anchor_lang::prelude::*;
use arcium_anchor::prelude::*;
use arcium_anchor::traits::InitCompDefAccs;
use arcium_client::idl::arcium::cpi::accounts::InitComputationDefinition;
use arcium_client::idl::arcium::cpi::init_computation_definition;
use arcium_client::idl::arcium::types::{
    CircuitSource,
    ComputationDefinitionMeta,
    ComputationSignature,
    OffChainCircuitSource,
};

fn init_offchain_comp_def<'info, T>(
    accounts: &mut T,
    finalize_during_callback: bool,
    cu_amount: u64,
    circuit_source_override: Option<CircuitSource>,
    finalize_authority: Option<Pubkey>,
) -> Result<()>
where
    T: InitCompDefAccs<'info>,
{
    let cpi_context = CpiContext::new(
        accounts.arcium_program(),
        InitComputationDefinition {
            signer: accounts.signer(),
            system_program: accounts.system_program(),
            mxe: accounts.mxe_acc(),
            comp_def_acc: accounts.comp_def_acc(),
        },
    );

    let signature = ComputationSignature {
        parameters: accounts.params(),
        outputs: accounts.outputs(),
    };
    let meta = ComputationDefinitionMeta {
        circuit_len: 0,
        signature,
    };

    init_computation_definition(
        cpi_context,
        accounts.comp_def_offset(),
        accounts.mxe_program(),
        meta,
        circuit_source_override,
        cu_amount,
        finalize_authority,
        finalize_during_callback,
    )?;

    Ok(())
}

// Circuit offsets
const COMP_DEF_OFFSET_ADD: u32 = comp_def_offset("add");
const COMP_DEF_OFFSET_SUBTRACT: u32 = comp_def_offset("subtract");
const COMP_DEF_OFFSET_MULTIPLY: u32 = comp_def_offset("multiply");
const COMP_DEF_OFFSET_DIVIDE: u32 = comp_def_offset("divide");
const COMP_DEF_OFFSET_MODULO: u32 = comp_def_offset("modulo");
const COMP_DEF_OFFSET_POWER: u32 = comp_def_offset("power");
const COMP_DEF_OFFSET_ABS_DIFF: u32 = comp_def_offset("abs_diff");
const COMP_DEF_OFFSET_GREATER_THAN: u32 = comp_def_offset("greater_than");
const COMP_DEF_OFFSET_LESS_THAN: u32 = comp_def_offset("less_than");
const COMP_DEF_OFFSET_EQUAL: u32 = comp_def_offset("equal");
const COMP_DEF_OFFSET_GREATER_EQUAL: u32 = comp_def_offset("greater_equal");
const COMP_DEF_OFFSET_LESS_EQUAL: u32 = comp_def_offset("less_equal");
const COMP_DEF_OFFSET_IN_RANGE: u32 = comp_def_offset("in_range");
const COMP_DEF_OFFSET_AND: u32 = comp_def_offset("and");
const COMP_DEF_OFFSET_OR: u32 = comp_def_offset("or");
const COMP_DEF_OFFSET_NOT: u32 = comp_def_offset("not");
const COMP_DEF_OFFSET_XOR: u32 = comp_def_offset("xor");
const COMP_DEF_OFFSET_IF_ELSE: u32 = comp_def_offset("if_else");
const COMP_DEF_OFFSET_AVERAGE: u32 = comp_def_offset("average");
const COMP_DEF_OFFSET_SUM: u32 = comp_def_offset("sum");
const COMP_DEF_OFFSET_MIN: u32 = comp_def_offset("min");
const COMP_DEF_OFFSET_MAX: u32 = comp_def_offset("max");
const COMP_DEF_OFFSET_MEDIAN: u32 = comp_def_offset("median");
const COMP_DEF_OFFSET_CREDIT_SCORE: u32 = comp_def_offset("credit_score");
const COMP_DEF_OFFSET_HEALTH_RISK: u32 = comp_def_offset("health_risk");
const COMP_DEF_OFFSET_VOTE_TALLY: u32 = comp_def_offset("vote_tally");
const COMP_DEF_OFFSET_MEETS_THRESHOLD: u32 = comp_def_offset("meets_threshold");
const COMP_DEF_OFFSET_WEIGHTED_AVERAGE: u32 = comp_def_offset("weighted_average");

declare_id!("EdNxpkFCVuSzwP5FmPxbSm4k9kvdyQ7dgRN9u4m7mRYJ");

#[arcium_program]
pub mod flaek_mxe {
    use super::*;

    pub fn init_add_comp_def(ctx: Context<InitAddCompDef>) -> Result<()> {
        init_offchain_comp_def(
            ctx.accounts,
            true,
            0,
            Some(CircuitSource::OffChain(OffChainCircuitSource {
                source: "https://brown-immense-amphibian-214.mypinata.cloud/ipfs/bafybeifk6o7nffgglzh7jm4ml6p357pr436amt5pk7f2xcavcqhpphvptu/circuits/devnet/add_devnet.arcis".to_string(),
                hash: [76, 115, 187, 89, 55, 27, 169, 16, 245, 168, 205, 39, 79, 95, 193, 169, 178, 252, 161, 169, 188, 227, 93, 165, 123, 121, 155, 226, 35, 147, 199, 75],
            })),
            None,
        )?;
        Ok(())
    }

    pub fn add(
        ctx: Context<Add>,
        computation_offset: u64,
        ciphertext_0: [u8; 32],
        ciphertext_1: [u8; 32],
        pub_key: [u8; 32],
        nonce: u128,
    ) -> Result<()> {
        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;
        let args = vec![
            Argument::ArcisPubkey(pub_key),
            Argument::PlaintextU128(nonce),
            Argument::EncryptedU64(ciphertext_0),
            Argument::EncryptedU64(ciphertext_1),
        ];

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            None,
            vec![AddCallback::callback_ix(&[])],
        )?;

        Ok(())
    }

    #[arcium_callback(encrypted_ix = "add")]
    pub fn add_callback(
        ctx: Context<AddCallback>,
        output: ComputationOutputs<AddOutput>,
    ) -> Result<()> {
        let o = match output {
            ComputationOutputs::Success(AddOutput { field_0 }) => field_0,
            _ => return Err(ErrorCode::AbortedComputation.into()),
        };

        emit!(AddEvent {
            result: o.ciphertexts[0],
            nonce: o.nonce.to_le_bytes(),
        });
        Ok(())
    }

    pub fn init_subtract_comp_def(ctx: Context<InitSubtractCompDef>) -> Result<()> {
        init_offchain_comp_def(
            ctx.accounts,
            true,
            0,
            Some(CircuitSource::OffChain(OffChainCircuitSource {
                source: "https://brown-immense-amphibian-214.mypinata.cloud/ipfs/bafybeifk6o7nffgglzh7jm4ml6p357pr436amt5pk7f2xcavcqhpphvptu/circuits/devnet/subtract_devnet.arcis".to_string(),
                hash: [127, 227, 2, 151, 207, 64, 206, 228, 243, 19, 69, 123, 42, 139, 3, 180, 231, 156, 12, 47, 172, 29, 233, 176, 138, 104, 174, 10, 139, 33, 219, 235],
            })),
            None,
        )?;
        Ok(())
    }

    pub fn subtract(
        ctx: Context<Subtract>,
        computation_offset: u64,
        ciphertext_0: [u8; 32],
        ciphertext_1: [u8; 32],
        pub_key: [u8; 32],
        nonce: u128,
    ) -> Result<()> {
        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;
        let args = vec![
            Argument::ArcisPubkey(pub_key),
            Argument::PlaintextU128(nonce),
            Argument::EncryptedU64(ciphertext_0),
            Argument::EncryptedU64(ciphertext_1),
        ];

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            None,
            vec![SubtractCallback::callback_ix(&[])],
        )?;

        Ok(())
    }

    #[arcium_callback(encrypted_ix = "subtract")]
    pub fn subtract_callback(
        ctx: Context<SubtractCallback>,
        output: ComputationOutputs<SubtractOutput>,
    ) -> Result<()> {
        let o = match output {
            ComputationOutputs::Success(SubtractOutput { field_0 }) => field_0,
            _ => return Err(ErrorCode::AbortedComputation.into()),
        };

        emit!(SubtractEvent {
            result: o.ciphertexts[0],
            nonce: o.nonce.to_le_bytes(),
        });
        Ok(())
    }

    pub fn init_multiply_comp_def(ctx: Context<InitMultiplyCompDef>) -> Result<()> {
        init_offchain_comp_def(
            ctx.accounts,
            true,
            0,
            Some(CircuitSource::OffChain(OffChainCircuitSource {
                source: "https://brown-immense-amphibian-214.mypinata.cloud/ipfs/bafybeifk6o7nffgglzh7jm4ml6p357pr436amt5pk7f2xcavcqhpphvptu/circuits/devnet/multiply_devnet.arcis".to_string(),
                hash: [39, 140, 80, 224, 126, 51, 109, 121, 107, 180, 12, 159, 40, 232, 174, 40, 190, 0, 226, 239, 94, 249, 182, 71, 227, 48, 253, 237, 202, 139, 132, 202],
            })),
            None,
        )?;
        Ok(())
    }

    pub fn multiply(
        ctx: Context<Multiply>,
        computation_offset: u64,
        ciphertext_0: [u8; 32],
        ciphertext_1: [u8; 32],
        pub_key: [u8; 32],
        nonce: u128,
    ) -> Result<()> {
        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;
        let args = vec![
            Argument::ArcisPubkey(pub_key),
            Argument::PlaintextU128(nonce),
            Argument::EncryptedU64(ciphertext_0),
            Argument::EncryptedU64(ciphertext_1),
        ];

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            None,
            vec![MultiplyCallback::callback_ix(&[])],
        )?;

        Ok(())
    }

    #[arcium_callback(encrypted_ix = "multiply")]
    pub fn multiply_callback(
        ctx: Context<MultiplyCallback>,
        output: ComputationOutputs<MultiplyOutput>,
    ) -> Result<()> {
        let o = match output {
            ComputationOutputs::Success(MultiplyOutput { field_0 }) => field_0,
            _ => return Err(ErrorCode::AbortedComputation.into()),
        };

        emit!(MultiplyEvent {
            result: o.ciphertexts[0],
            nonce: o.nonce.to_le_bytes(),
        });
        Ok(())
    }

    pub fn init_divide_comp_def(ctx: Context<InitDivideCompDef>) -> Result<()> {
        init_offchain_comp_def(
            ctx.accounts,
            true,
            0,
            Some(CircuitSource::OffChain(OffChainCircuitSource {
                source: "https://brown-immense-amphibian-214.mypinata.cloud/ipfs/bafybeifk6o7nffgglzh7jm4ml6p357pr436amt5pk7f2xcavcqhpphvptu/circuits/devnet/divide_devnet.arcis".to_string(),
                hash: [184, 73, 18, 157, 97, 113, 177, 70, 171, 92, 142, 217, 190, 68, 115, 163, 15, 67, 236, 175, 91, 150, 154, 0, 20, 142, 92, 140, 86, 125, 6, 242],
            })),
            None,
        )?;
        Ok(())
    }

    pub fn divide(
        ctx: Context<Divide>,
        computation_offset: u64,
        ciphertext_0: [u8; 32],
        ciphertext_1: [u8; 32],
        pub_key: [u8; 32],
        nonce: u128,
    ) -> Result<()> {
        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;
        let args = vec![
            Argument::ArcisPubkey(pub_key),
            Argument::PlaintextU128(nonce),
            Argument::EncryptedU64(ciphertext_0),
            Argument::EncryptedU64(ciphertext_1),
        ];

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            None,
            vec![DivideCallback::callback_ix(&[])],
        )?;

        Ok(())
    }

    #[arcium_callback(encrypted_ix = "divide")]
    pub fn divide_callback(
        ctx: Context<DivideCallback>,
        output: ComputationOutputs<DivideOutput>,
    ) -> Result<()> {
        let o = match output {
            ComputationOutputs::Success(DivideOutput { field_0 }) => field_0,
            _ => return Err(ErrorCode::AbortedComputation.into()),
        };

        emit!(DivideEvent {
            result: o.ciphertexts[0],
            nonce: o.nonce.to_le_bytes(),
        });
        Ok(())
    }

    pub fn init_modulo_comp_def(ctx: Context<InitModuloCompDef>) -> Result<()> {
        init_offchain_comp_def(
            ctx.accounts,
            true,
            0,
            Some(CircuitSource::OffChain(OffChainCircuitSource {
                source: "https://brown-immense-amphibian-214.mypinata.cloud/ipfs/bafybeifk6o7nffgglzh7jm4ml6p357pr436amt5pk7f2xcavcqhpphvptu/circuits/devnet/modulo_devnet.arcis".to_string(),
                hash: [243, 69, 24, 91, 145, 123, 81, 128, 222, 138, 150, 50, 181, 161, 222, 233, 74, 218, 80, 155, 73, 127, 116, 80, 149, 87, 129, 70, 44, 86, 252, 146],
            })),
            None,
        )?;
        Ok(())
    }

    pub fn modulo(
        ctx: Context<Modulo>,
        computation_offset: u64,
        ciphertext_0: [u8; 32],
        ciphertext_1: [u8; 32],
        pub_key: [u8; 32],
        nonce: u128,
    ) -> Result<()> {
        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;
        let args = vec![
            Argument::ArcisPubkey(pub_key),
            Argument::PlaintextU128(nonce),
            Argument::EncryptedU64(ciphertext_0),
            Argument::EncryptedU64(ciphertext_1),
        ];

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            None,
            vec![ModuloCallback::callback_ix(&[])],
        )?;

        Ok(())
    }

    #[arcium_callback(encrypted_ix = "modulo")]
    pub fn modulo_callback(
        ctx: Context<ModuloCallback>,
        output: ComputationOutputs<ModuloOutput>,
    ) -> Result<()> {
        let o = match output {
            ComputationOutputs::Success(ModuloOutput { field_0 }) => field_0,
            _ => return Err(ErrorCode::AbortedComputation.into()),
        };

        emit!(ModuloEvent {
            result: o.ciphertexts[0],
            nonce: o.nonce.to_le_bytes(),
        });
        Ok(())
    }

    pub fn init_abs_diff_comp_def(ctx: Context<InitAbsDiffCompDef>) -> Result<()> {
        init_offchain_comp_def(
            ctx.accounts,
            true,
            0,
            Some(CircuitSource::OffChain(OffChainCircuitSource {
                source: "https://brown-immense-amphibian-214.mypinata.cloud/ipfs/bafybeifk6o7nffgglzh7jm4ml6p357pr436amt5pk7f2xcavcqhpphvptu/circuits/devnet/abs_diff_devnet.arcis".to_string(),
                hash: [161, 115, 141, 29, 160, 189, 78, 169, 110, 203, 247, 122, 227, 28, 83, 125, 200, 215, 84, 155, 37, 134, 61, 75, 166, 39, 233, 255, 139, 126, 48, 253],
            })),
            None,
        )?;
        Ok(())
    }

    pub fn abs_diff(
        ctx: Context<AbsDiff>,
        computation_offset: u64,
        ciphertext_0: [u8; 32],
        ciphertext_1: [u8; 32],
        pub_key: [u8; 32],
        nonce: u128,
    ) -> Result<()> {
        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;
        let args = vec![
            Argument::ArcisPubkey(pub_key),
            Argument::PlaintextU128(nonce),
            Argument::EncryptedU64(ciphertext_0),
            Argument::EncryptedU64(ciphertext_1),
        ];

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            None,
            vec![AbsDiffCallback::callback_ix(&[])],
        )?;

        Ok(())
    }

    #[arcium_callback(encrypted_ix = "abs_diff")]
    pub fn abs_diff_callback(
        ctx: Context<AbsDiffCallback>,
        output: ComputationOutputs<AbsDiffOutput>,
    ) -> Result<()> {
        let o = match output {
            ComputationOutputs::Success(AbsDiffOutput { field_0 }) => field_0,
            _ => return Err(ErrorCode::AbortedComputation.into()),
        };

        emit!(AbsDiffEvent {
            result: o.ciphertexts[0],
            nonce: o.nonce.to_le_bytes(),
        });
        Ok(())
    }

    pub fn init_power_comp_def(ctx: Context<InitPowerCompDef>) -> Result<()> {
        init_offchain_comp_def(
            ctx.accounts,
            true,
            0,
            Some(CircuitSource::OffChain(OffChainCircuitSource {
                source: "https://brown-immense-amphibian-214.mypinata.cloud/ipfs/bafybeifk6o7nffgglzh7jm4ml6p357pr436amt5pk7f2xcavcqhpphvptu/circuits/devnet/power_devnet.arcis".to_string(),
                hash: [48, 169, 117, 96, 88, 110, 84, 93, 44, 149, 70, 112, 201, 112, 245, 125, 205, 34, 11, 209, 212, 116, 90, 4, 82, 166, 165, 185, 27, 8, 91, 179],
            })),
            None,
        )?;
        Ok(())
    }

    pub fn power(
        ctx: Context<Power>,
        computation_offset: u64,
        ciphertext_0: [u8; 32],
        ciphertext_1: [u8; 32],
        pub_key: [u8; 32],
        nonce: u128,
    ) -> Result<()> {
        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;
        let args = vec![
            Argument::ArcisPubkey(pub_key),
            Argument::PlaintextU128(nonce),
            Argument::EncryptedU64(ciphertext_0),
            Argument::EncryptedU8(ciphertext_1),
        ];

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            None,
            vec![PowerCallback::callback_ix(&[])],
        )?;

        Ok(())
    }

    #[arcium_callback(encrypted_ix = "power")]
    pub fn power_callback(
        ctx: Context<PowerCallback>,
        output: ComputationOutputs<PowerOutput>,
    ) -> Result<()> {
        let o = match output {
            ComputationOutputs::Success(PowerOutput { field_0 }) => field_0,
            _ => return Err(ErrorCode::AbortedComputation.into()),
        };

        emit!(PowerEvent {
            result: o.ciphertexts[0],
            nonce: o.nonce.to_le_bytes(),
        });
        Ok(())
    }

    pub fn init_greater_than_comp_def(ctx: Context<InitGreaterThanCompDef>) -> Result<()> {
        init_offchain_comp_def(
            ctx.accounts,
            true,
            0,
            Some(CircuitSource::OffChain(OffChainCircuitSource {
                source: "https://brown-immense-amphibian-214.mypinata.cloud/ipfs/bafybeifk6o7nffgglzh7jm4ml6p357pr436amt5pk7f2xcavcqhpphvptu/circuits/devnet/greater_than_devnet.arcis".to_string(),
                hash: [147, 66, 88, 108, 169, 151, 141, 64, 156, 94, 74, 194, 130, 225, 146, 218, 68, 151, 157, 162, 42, 243, 52, 207, 198, 103, 147, 186, 57, 14, 142, 147],
            })),
            None,
        )?;
        Ok(())
    }

    pub fn greater_than(
        ctx: Context<GreaterThan>,
        computation_offset: u64,
        ciphertext_0: [u8; 32],
        ciphertext_1: [u8; 32],
        pub_key: [u8; 32],
        nonce: u128,
    ) -> Result<()> {
        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;
        let args = vec![
            Argument::ArcisPubkey(pub_key),
            Argument::PlaintextU128(nonce),
            Argument::EncryptedU64(ciphertext_0),
            Argument::EncryptedU64(ciphertext_1),
        ];

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            None,
            vec![GreaterThanCallback::callback_ix(&[])],
        )?;

        Ok(())
    }

    #[arcium_callback(encrypted_ix = "greater_than")]
    pub fn greater_than_callback(
        ctx: Context<GreaterThanCallback>,
        output: ComputationOutputs<GreaterThanOutput>,
    ) -> Result<()> {
        let o = match output {
            ComputationOutputs::Success(GreaterThanOutput { field_0 }) => field_0,
            _ => return Err(ErrorCode::AbortedComputation.into()),
        };

        emit!(GreaterThanEvent {
            result: o.ciphertexts[0],
            nonce: o.nonce.to_le_bytes(),
        });
        Ok(())
    }

    pub fn init_less_than_comp_def(ctx: Context<InitLessThanCompDef>) -> Result<()> {
        init_offchain_comp_def(
            ctx.accounts,
            true,
            0,
            Some(CircuitSource::OffChain(OffChainCircuitSource {
                source: "https://brown-immense-amphibian-214.mypinata.cloud/ipfs/bafybeifk6o7nffgglzh7jm4ml6p357pr436amt5pk7f2xcavcqhpphvptu/circuits/devnet/less_than_devnet.arcis".to_string(),
                hash: [181, 145, 96, 126, 109, 170, 113, 15, 109, 188, 240, 250, 79, 124, 212, 229, 209, 26, 219, 239, 76, 232, 33, 218, 173, 172, 185, 72, 245, 21, 47, 171],
            })),
            None,
        )?;
        Ok(())
    }

    pub fn less_than(
        ctx: Context<LessThan>,
        computation_offset: u64,
        ciphertext_0: [u8; 32],
        ciphertext_1: [u8; 32],
        pub_key: [u8; 32],
        nonce: u128,
    ) -> Result<()> {
        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;
        let args = vec![
            Argument::ArcisPubkey(pub_key),
            Argument::PlaintextU128(nonce),
            Argument::EncryptedU64(ciphertext_0),
            Argument::EncryptedU64(ciphertext_1),
        ];

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            None,
            vec![LessThanCallback::callback_ix(&[])],
        )?;

        Ok(())
    }

    #[arcium_callback(encrypted_ix = "less_than")]
    pub fn less_than_callback(
        ctx: Context<LessThanCallback>,
        output: ComputationOutputs<LessThanOutput>,
    ) -> Result<()> {
        let o = match output {
            ComputationOutputs::Success(LessThanOutput { field_0 }) => field_0,
            _ => return Err(ErrorCode::AbortedComputation.into()),
        };

        emit!(LessThanEvent {
            result: o.ciphertexts[0],
            nonce: o.nonce.to_le_bytes(),
        });
        Ok(())
    }

    pub fn init_equal_comp_def(ctx: Context<InitEqualCompDef>) -> Result<()> {
        init_offchain_comp_def(
            ctx.accounts,
            true,
            0,
            Some(CircuitSource::OffChain(OffChainCircuitSource {
                source: "https://brown-immense-amphibian-214.mypinata.cloud/ipfs/bafybeifk6o7nffgglzh7jm4ml6p357pr436amt5pk7f2xcavcqhpphvptu/circuits/devnet/equal_devnet.arcis".to_string(),
                hash: [206, 212, 162, 93, 163, 9, 148, 192, 178, 163, 11, 184, 136, 103, 171, 83, 4, 26, 65, 3, 222, 255, 159, 5, 45, 104, 42, 14, 13, 247, 46, 18],
            })),
            None,
        )?;
        Ok(())
    }

    pub fn equal(
        ctx: Context<Equal>,
        computation_offset: u64,
        ciphertext_0: [u8; 32],
        ciphertext_1: [u8; 32],
        pub_key: [u8; 32],
        nonce: u128,
    ) -> Result<()> {
        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;
        let args = vec![
            Argument::ArcisPubkey(pub_key),
            Argument::PlaintextU128(nonce),
            Argument::EncryptedU64(ciphertext_0),
            Argument::EncryptedU64(ciphertext_1),
        ];

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            None,
            vec![EqualCallback::callback_ix(&[])],
        )?;

        Ok(())
    }

    #[arcium_callback(encrypted_ix = "equal")]
    pub fn equal_callback(
        ctx: Context<EqualCallback>,
        output: ComputationOutputs<EqualOutput>,
    ) -> Result<()> {
        let o = match output {
            ComputationOutputs::Success(EqualOutput { field_0 }) => field_0,
            _ => return Err(ErrorCode::AbortedComputation.into()),
        };

        emit!(EqualEvent {
            result: o.ciphertexts[0],
            nonce: o.nonce.to_le_bytes(),
        });
        Ok(())
    }

    pub fn init_greater_equal_comp_def(ctx: Context<InitGreaterEqualCompDef>) -> Result<()> {
        init_offchain_comp_def(
            ctx.accounts,
            true,
            0,
            Some(CircuitSource::OffChain(OffChainCircuitSource {
                source: "https://brown-immense-amphibian-214.mypinata.cloud/ipfs/bafybeifk6o7nffgglzh7jm4ml6p357pr436amt5pk7f2xcavcqhpphvptu/circuits/devnet/greater_equal_devnet.arcis".to_string(),
                hash: [4, 105, 225, 184, 124, 232, 63, 119, 13, 226, 185, 87, 141, 54, 104, 31, 212, 112, 143, 167, 255, 206, 199, 46, 196, 65, 194, 204, 166, 153, 114, 232],
            })),
            None,
        )?;
        Ok(())
    }

    pub fn greater_equal(
        ctx: Context<GreaterEqual>,
        computation_offset: u64,
        ciphertext_0: [u8; 32],
        ciphertext_1: [u8; 32],
        pub_key: [u8; 32],
        nonce: u128,
    ) -> Result<()> {
        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;
        let args = vec![
            Argument::ArcisPubkey(pub_key),
            Argument::PlaintextU128(nonce),
            Argument::EncryptedU64(ciphertext_0),
            Argument::EncryptedU64(ciphertext_1),
        ];

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            None,
            vec![GreaterEqualCallback::callback_ix(&[])],
        )?;

        Ok(())
    }

    #[arcium_callback(encrypted_ix = "greater_equal")]
    pub fn greater_equal_callback(
        ctx: Context<GreaterEqualCallback>,
        output: ComputationOutputs<GreaterEqualOutput>,
    ) -> Result<()> {
        let o = match output {
            ComputationOutputs::Success(GreaterEqualOutput { field_0 }) => field_0,
            _ => return Err(ErrorCode::AbortedComputation.into()),
        };

        emit!(GreaterEqualEvent {
            result: o.ciphertexts[0],
            nonce: o.nonce.to_le_bytes(),
        });
        Ok(())
    }

    pub fn init_less_equal_comp_def(ctx: Context<InitLessEqualCompDef>) -> Result<()> {
        init_offchain_comp_def(
            ctx.accounts,
            true,
            0,
            Some(CircuitSource::OffChain(OffChainCircuitSource {
                source: "https://brown-immense-amphibian-214.mypinata.cloud/ipfs/bafybeifk6o7nffgglzh7jm4ml6p357pr436amt5pk7f2xcavcqhpphvptu/circuits/devnet/less_equal_devnet.arcis".to_string(),
                hash: [12, 154, 182, 66, 3, 141, 237, 156, 234, 249, 150, 2, 164, 180, 48, 16, 79, 234, 146, 203, 214, 30, 133, 202, 255, 189, 96, 105, 108, 151, 7, 197],
            })),
            None,
        )?;
        Ok(())
    }

    pub fn less_equal(
        ctx: Context<LessEqual>,
        computation_offset: u64,
        ciphertext_0: [u8; 32],
        ciphertext_1: [u8; 32],
        pub_key: [u8; 32],
        nonce: u128,
    ) -> Result<()> {
        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;
        let args = vec![
            Argument::ArcisPubkey(pub_key),
            Argument::PlaintextU128(nonce),
            Argument::EncryptedU64(ciphertext_0),
            Argument::EncryptedU64(ciphertext_1),
        ];

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            None,
            vec![LessEqualCallback::callback_ix(&[])],
        )?;

        Ok(())
    }

    #[arcium_callback(encrypted_ix = "less_equal")]
    pub fn less_equal_callback(
        ctx: Context<LessEqualCallback>,
        output: ComputationOutputs<LessEqualOutput>,
    ) -> Result<()> {
        let o = match output {
            ComputationOutputs::Success(LessEqualOutput { field_0 }) => field_0,
            _ => return Err(ErrorCode::AbortedComputation.into()),
        };

        emit!(LessEqualEvent {
            result: o.ciphertexts[0],
            nonce: o.nonce.to_le_bytes(),
        });
        Ok(())
    }

    pub fn init_meets_threshold_comp_def(ctx: Context<InitMeetsThresholdCompDef>) -> Result<()> {
        init_offchain_comp_def(
            ctx.accounts,
            true,
            0,
            Some(CircuitSource::OffChain(OffChainCircuitSource {
                source: "https://brown-immense-amphibian-214.mypinata.cloud/ipfs/bafybeifk6o7nffgglzh7jm4ml6p357pr436amt5pk7f2xcavcqhpphvptu/circuits/devnet/meets_threshold_devnet.arcis".to_string(),
                hash: [4, 105, 225, 184, 124, 232, 63, 119, 13, 226, 185, 87, 141, 54, 104, 31, 212, 112, 143, 167, 255, 206, 199, 46, 196, 65, 194, 204, 166, 153, 114, 232],
            })),
            None,
        )?;
        Ok(())
    }

    pub fn meets_threshold(
        ctx: Context<MeetsThreshold>,
        computation_offset: u64,
        ciphertext_0: [u8; 32],
        ciphertext_1: [u8; 32],
        pub_key: [u8; 32],
        nonce: u128,
    ) -> Result<()> {
        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;
        let args = vec![
            Argument::ArcisPubkey(pub_key),
            Argument::PlaintextU128(nonce),
            Argument::EncryptedU64(ciphertext_0),
            Argument::EncryptedU64(ciphertext_1),
        ];

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            None,
            vec![MeetsThresholdCallback::callback_ix(&[])],
        )?;

        Ok(())
    }

    #[arcium_callback(encrypted_ix = "meets_threshold")]
    pub fn meets_threshold_callback(
        ctx: Context<MeetsThresholdCallback>,
        output: ComputationOutputs<MeetsThresholdOutput>,
    ) -> Result<()> {
        let o = match output {
            ComputationOutputs::Success(MeetsThresholdOutput { field_0 }) => field_0,
            _ => return Err(ErrorCode::AbortedComputation.into()),
        };

        emit!(MeetsThresholdEvent {
            result: o.ciphertexts[0],
            nonce: o.nonce.to_le_bytes(),
        });
        Ok(())
    }

    pub fn init_in_range_comp_def(ctx: Context<InitInRangeCompDef>) -> Result<()> {
        init_offchain_comp_def(
            ctx.accounts,
            true,
            0,
            Some(CircuitSource::OffChain(OffChainCircuitSource {
                source: "https://brown-immense-amphibian-214.mypinata.cloud/ipfs/bafybeifk6o7nffgglzh7jm4ml6p357pr436amt5pk7f2xcavcqhpphvptu/circuits/devnet/in_range_devnet.arcis".to_string(),
                hash: [233, 195, 53, 195, 44, 119, 61, 153, 140, 182, 239, 20, 189, 154, 92, 143, 172, 192, 43, 102, 177, 255, 161, 204, 81, 121, 41, 169, 171, 163, 117, 197],
            })),
            None,
        )?;
        Ok(())
    }

    pub fn in_range(
        ctx: Context<InRange>,
        computation_offset: u64,
        ciphertext_0: [u8; 32],
        ciphertext_1: [u8; 32],
        ciphertext_2: [u8; 32],
        pub_key: [u8; 32],
        nonce: u128,
    ) -> Result<()> {
        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;
        let args = vec![
            Argument::ArcisPubkey(pub_key),
            Argument::PlaintextU128(nonce),
            Argument::EncryptedU64(ciphertext_0),
            Argument::EncryptedU64(ciphertext_1),
            Argument::EncryptedU64(ciphertext_2),
        ];

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            None,
            vec![InRangeCallback::callback_ix(&[])],
        )?;

        Ok(())
    }

    #[arcium_callback(encrypted_ix = "in_range")]
    pub fn in_range_callback(
        ctx: Context<InRangeCallback>,
        output: ComputationOutputs<InRangeOutput>,
    ) -> Result<()> {
        let o = match output {
            ComputationOutputs::Success(InRangeOutput { field_0 }) => field_0,
            _ => return Err(ErrorCode::AbortedComputation.into()),
        };

        emit!(InRangeEvent {
            result: o.ciphertexts[0],
            nonce: o.nonce.to_le_bytes(),
        });
        Ok(())
    }

    pub fn init_and_comp_def(ctx: Context<InitAndCompDef>) -> Result<()> {
        init_offchain_comp_def(
            ctx.accounts,
            true,
            0,
            Some(CircuitSource::OffChain(OffChainCircuitSource {
                source: "https://brown-immense-amphibian-214.mypinata.cloud/ipfs/bafybeifk6o7nffgglzh7jm4ml6p357pr436amt5pk7f2xcavcqhpphvptu/circuits/devnet/and_devnet.arcis".to_string(),
                hash: [138, 11, 216, 68, 43, 65, 102, 185, 252, 200, 187, 154, 244, 236, 121, 84, 187, 5, 198, 198, 28, 181, 136, 177, 11, 178, 93, 31, 40, 164, 223, 185],
            })),
            None,
        )?;
        Ok(())
    }

    pub fn and(
        ctx: Context<And>,
        computation_offset: u64,
        ciphertext_0: [u8; 32],
        ciphertext_1: [u8; 32],
        pub_key: [u8; 32],
        nonce: u128,
    ) -> Result<()> {
        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;
        let args = vec![
            Argument::ArcisPubkey(pub_key),
            Argument::PlaintextU128(nonce),
            Argument::EncryptedU8(ciphertext_0),
            Argument::EncryptedU8(ciphertext_1),
        ];

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            None,
            vec![AndCallback::callback_ix(&[])],
        )?;

        Ok(())
    }

    #[arcium_callback(encrypted_ix = "and")]
    pub fn and_callback(
        ctx: Context<AndCallback>,
        output: ComputationOutputs<AndOutput>,
    ) -> Result<()> {
        let o = match output {
            ComputationOutputs::Success(AndOutput { field_0 }) => field_0,
            _ => return Err(ErrorCode::AbortedComputation.into()),
        };

        emit!(AndEvent {
            result: o.ciphertexts[0],
            nonce: o.nonce.to_le_bytes(),
        });
        Ok(())
    }

    pub fn init_or_comp_def(ctx: Context<InitOrCompDef>) -> Result<()> {
        init_offchain_comp_def(
            ctx.accounts,
            true,
            0,
            Some(CircuitSource::OffChain(OffChainCircuitSource {
                source: "https://brown-immense-amphibian-214.mypinata.cloud/ipfs/bafybeifk6o7nffgglzh7jm4ml6p357pr436amt5pk7f2xcavcqhpphvptu/circuits/devnet/or_devnet.arcis".to_string(),
                hash: [211, 19, 214, 117, 81, 113, 182, 148, 133, 74, 92, 89, 112, 80, 23, 27, 96, 46, 84, 125, 100, 153, 174, 103, 39, 121, 155, 81, 158, 239, 244, 235],
            })),
            None,
        )?;
        Ok(())
    }

    pub fn or(
        ctx: Context<Or>,
        computation_offset: u64,
        ciphertext_0: [u8; 32],
        ciphertext_1: [u8; 32],
        pub_key: [u8; 32],
        nonce: u128,
    ) -> Result<()> {
        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;
        let args = vec![
            Argument::ArcisPubkey(pub_key),
            Argument::PlaintextU128(nonce),
            Argument::EncryptedU8(ciphertext_0),
            Argument::EncryptedU8(ciphertext_1),
        ];

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            None,
            vec![OrCallback::callback_ix(&[])],
        )?;

        Ok(())
    }

    #[arcium_callback(encrypted_ix = "or")]
    pub fn or_callback(
        ctx: Context<OrCallback>,
        output: ComputationOutputs<OrOutput>,
    ) -> Result<()> {
        let o = match output {
            ComputationOutputs::Success(OrOutput { field_0 }) => field_0,
            _ => return Err(ErrorCode::AbortedComputation.into()),
        };

        emit!(OrEvent {
            result: o.ciphertexts[0],
            nonce: o.nonce.to_le_bytes(),
        });
        Ok(())
    }

    pub fn init_xor_comp_def(ctx: Context<InitXorCompDef>) -> Result<()> {
        init_offchain_comp_def(
            ctx.accounts,
            true,
            0,
            Some(CircuitSource::OffChain(OffChainCircuitSource {
                source: "https://brown-immense-amphibian-214.mypinata.cloud/ipfs/bafybeifk6o7nffgglzh7jm4ml6p357pr436amt5pk7f2xcavcqhpphvptu/circuits/devnet/xor_devnet.arcis".to_string(),
                hash: [100, 26, 108, 104, 254, 34, 33, 156, 254, 15, 239, 219, 213, 198, 140, 208, 133, 82, 106, 16, 203, 203, 254, 73, 240, 80, 243, 6, 28, 25, 35, 132],
            })),
            None,
        )?;
        Ok(())
    }

    pub fn xor(
        ctx: Context<Xor>,
        computation_offset: u64,
        ciphertext_0: [u8; 32],
        ciphertext_1: [u8; 32],
        pub_key: [u8; 32],
        nonce: u128,
    ) -> Result<()> {
        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;
        let args = vec![
            Argument::ArcisPubkey(pub_key),
            Argument::PlaintextU128(nonce),
            Argument::EncryptedU8(ciphertext_0),
            Argument::EncryptedU8(ciphertext_1),
        ];

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            None,
            vec![XorCallback::callback_ix(&[])],
        )?;

        Ok(())
    }

    #[arcium_callback(encrypted_ix = "xor")]
    pub fn xor_callback(
        ctx: Context<XorCallback>,
        output: ComputationOutputs<XorOutput>,
    ) -> Result<()> {
        let o = match output {
            ComputationOutputs::Success(XorOutput { field_0 }) => field_0,
            _ => return Err(ErrorCode::AbortedComputation.into()),
        };

        emit!(XorEvent {
            result: o.ciphertexts[0],
            nonce: o.nonce.to_le_bytes(),
        });
        Ok(())
    }

    pub fn init_not_comp_def(ctx: Context<InitNotCompDef>) -> Result<()> {
        init_offchain_comp_def(
            ctx.accounts,
            true,
            0,
            Some(CircuitSource::OffChain(OffChainCircuitSource {
                source: "https://brown-immense-amphibian-214.mypinata.cloud/ipfs/bafybeifk6o7nffgglzh7jm4ml6p357pr436amt5pk7f2xcavcqhpphvptu/circuits/devnet/not_devnet.arcis".to_string(),
                hash: [250, 81, 31, 53, 118, 82, 133, 22, 130, 255, 232, 101, 208, 26, 247, 139, 253, 118, 158, 220, 145, 54, 187, 211, 114, 81, 4, 198, 233, 157, 68, 65],
            })),
            None,
        )?;
        Ok(())
    }

    pub fn not(
        ctx: Context<Not>,
        computation_offset: u64,
        ciphertext_0: [u8; 32],
        pub_key: [u8; 32],
        nonce: u128,
    ) -> Result<()> {
        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;
        let args = vec![
            Argument::ArcisPubkey(pub_key),
            Argument::PlaintextU128(nonce),
            Argument::EncryptedU8(ciphertext_0),
        ];

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            None,
            vec![NotCallback::callback_ix(&[])],
        )?;

        Ok(())
    }

    #[arcium_callback(encrypted_ix = "not")]
    pub fn not_callback(
        ctx: Context<NotCallback>,
        output: ComputationOutputs<NotOutput>,
    ) -> Result<()> {
        let o = match output {
            ComputationOutputs::Success(NotOutput { field_0 }) => field_0,
            _ => return Err(ErrorCode::AbortedComputation.into()),
        };

        emit!(NotEvent {
            result: o.ciphertexts[0],
            nonce: o.nonce.to_le_bytes(),
        });
        Ok(())
    }

    pub fn init_if_else_comp_def(ctx: Context<InitIfElseCompDef>) -> Result<()> {
        init_offchain_comp_def(
            ctx.accounts,
            true,
            0,
            Some(CircuitSource::OffChain(OffChainCircuitSource {
                source: "https://brown-immense-amphibian-214.mypinata.cloud/ipfs/bafybeifk6o7nffgglzh7jm4ml6p357pr436amt5pk7f2xcavcqhpphvptu/circuits/devnet/if_else_devnet.arcis".to_string(),
                hash: [195, 205, 197, 200, 12, 64, 22, 73, 50, 31, 39, 3, 5, 215, 158, 143, 14, 173, 168, 231, 43, 161, 179, 67, 105, 11, 222, 141, 180, 92, 217, 60],
            })),
            None,
        )?;
        Ok(())
    }

    pub fn if_else(
        ctx: Context<IfElse>,
        computation_offset: u64,
        ciphertext_0: [u8; 32],
        ciphertext_1: [u8; 32],
        ciphertext_2: [u8; 32],
        pub_key: [u8; 32],
        nonce: u128,
    ) -> Result<()> {
        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;
        let args = vec![
            Argument::ArcisPubkey(pub_key),
            Argument::PlaintextU128(nonce),
            Argument::EncryptedU8(ciphertext_0),
            Argument::EncryptedU64(ciphertext_1),
            Argument::EncryptedU64(ciphertext_2),
        ];

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            None,
            vec![IfElseCallback::callback_ix(&[])],
        )?;

        Ok(())
    }

    #[arcium_callback(encrypted_ix = "if_else")]
    pub fn if_else_callback(
        ctx: Context<IfElseCallback>,
        output: ComputationOutputs<IfElseOutput>,
    ) -> Result<()> {
        let o = match output {
            ComputationOutputs::Success(IfElseOutput { field_0 }) => field_0,
            _ => return Err(ErrorCode::AbortedComputation.into()),
        };

        emit!(IfElseEvent {
            result: o.ciphertexts[0],
            nonce: o.nonce.to_le_bytes(),
        });
        Ok(())
    }

    pub fn init_vote_tally_comp_def(ctx: Context<InitVoteTallyCompDef>) -> Result<()> {
        init_offchain_comp_def(
            ctx.accounts,
            true,
            0,
            Some(CircuitSource::OffChain(OffChainCircuitSource {
                source: "https://brown-immense-amphibian-214.mypinata.cloud/ipfs/bafybeifk6o7nffgglzh7jm4ml6p357pr436amt5pk7f2xcavcqhpphvptu/circuits/devnet/vote_tally_devnet.arcis".to_string(),
                hash: [32, 18, 66, 129, 137, 214, 186, 21, 104, 58, 248, 170, 162, 18, 27, 179, 22, 199, 127, 62, 178, 183, 227, 205, 126, 173, 162, 1, 102, 4, 47, 15],
            })),
            None,
        )?;
        Ok(())
    }

    pub fn vote_tally(
        ctx: Context<VoteTally>,
        computation_offset: u64,
        ciphertext_0: [u8; 32],
        pub_key: [u8; 32],
        nonce: u128,
    ) -> Result<()> {
        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;
        let args = vec![
            Argument::ArcisPubkey(pub_key),
            Argument::PlaintextU128(nonce),
            Argument::EncryptedU8(ciphertext_0),
        ];

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            None,
            vec![VoteTallyCallback::callback_ix(&[])],
        )?;

        Ok(())
    }

    #[arcium_callback(encrypted_ix = "vote_tally")]
    pub fn vote_tally_callback(
        ctx: Context<VoteTallyCallback>,
        output: ComputationOutputs<VoteTallyOutput>,
    ) -> Result<()> {
        let o = match output {
            ComputationOutputs::Success(VoteTallyOutput { field_0 }) => field_0,
            _ => return Err(ErrorCode::AbortedComputation.into()),
        };

        emit!(VoteTallyEvent {
            result: o.ciphertexts[0],
            nonce: o.nonce.to_le_bytes(),
        });
        Ok(())
    }

    pub fn init_average_comp_def(ctx: Context<InitAverageCompDef>) -> Result<()> {
        init_offchain_comp_def(
            ctx.accounts,
            true,
            0,
            Some(CircuitSource::OffChain(OffChainCircuitSource {
                source: "https://brown-immense-amphibian-214.mypinata.cloud/ipfs/bafybeifk6o7nffgglzh7jm4ml6p357pr436amt5pk7f2xcavcqhpphvptu/circuits/devnet/average_devnet.arcis".to_string(),
                hash: [15, 106, 194, 134, 5, 201, 93, 123, 94, 195, 162, 41, 125, 205, 45, 6, 151, 70, 146, 33, 5, 158, 166, 76, 92, 98, 69, 147, 83, 238, 105, 195],
            })),
            None,
        )?;
        Ok(())
    }

    pub fn average(
        ctx: Context<Average>,
        computation_offset: u64,
        values: [u8; 32],
        count: [u8; 32],
        pub_key: [u8; 32],
        nonce: u128,
    ) -> Result<()> {
        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;
        let args = vec![
            Argument::ArcisPubkey(pub_key),
            Argument::PlaintextU128(nonce),
            Argument::EncryptedU64(values),
            Argument::EncryptedU8(count),
        ];

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            None,
            vec![AverageCallback::callback_ix(&[])],
        )?;

        Ok(())
    }

    #[arcium_callback(encrypted_ix = "average")]
    pub fn average_callback(
        ctx: Context<AverageCallback>,
        output: ComputationOutputs<AverageOutput>,
    ) -> Result<()> {
        let o = match output {
            ComputationOutputs::Success(AverageOutput { field_0 }) => field_0,
            _ => return Err(ErrorCode::AbortedComputation.into()),
        };

        emit!(AverageEvent {
            result: o.ciphertexts[0],
            nonce: o.nonce.to_le_bytes(),
        });
        Ok(())
    }

    pub fn init_sum_comp_def(ctx: Context<InitSumCompDef>) -> Result<()> {
        init_offchain_comp_def(
            ctx.accounts,
            true,
            0,
            Some(CircuitSource::OffChain(OffChainCircuitSource {
                source: "https://brown-immense-amphibian-214.mypinata.cloud/ipfs/bafybeifk6o7nffgglzh7jm4ml6p357pr436amt5pk7f2xcavcqhpphvptu/circuits/devnet/sum_devnet.arcis".to_string(),
                hash: [167, 116, 170, 125, 249, 48, 147, 95, 186, 93, 49, 15, 157, 117, 49, 25, 126, 215, 230, 5, 172, 61, 249, 125, 241, 71, 150, 213, 226, 112, 191, 211],
            })),
            None,
        )?;
        Ok(())
    }

    pub fn sum(
        ctx: Context<Sum>,
        computation_offset: u64,
        values: [u8; 32],
        count: [u8; 32],
        pub_key: [u8; 32],
        nonce: u128,
    ) -> Result<()> {
        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;
        let args = vec![
            Argument::ArcisPubkey(pub_key),
            Argument::PlaintextU128(nonce),
            Argument::EncryptedU64(values),
            Argument::EncryptedU8(count),
        ];

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            None,
            vec![SumCallback::callback_ix(&[])],
        )?;

        Ok(())
    }

    #[arcium_callback(encrypted_ix = "sum")]
    pub fn sum_callback(
        ctx: Context<SumCallback>,
        output: ComputationOutputs<SumOutput>,
    ) -> Result<()> {
        let o = match output {
            ComputationOutputs::Success(SumOutput { field_0 }) => field_0,
            _ => return Err(ErrorCode::AbortedComputation.into()),
        };

        emit!(SumEvent {
            result: o.ciphertexts[0],
            nonce: o.nonce.to_le_bytes(),
        });
        Ok(())
    }

    pub fn init_min_comp_def(ctx: Context<InitMinCompDef>) -> Result<()> {
        init_offchain_comp_def(
            ctx.accounts,
            true,
            0,
            Some(CircuitSource::OffChain(OffChainCircuitSource {
                source: "https://brown-immense-amphibian-214.mypinata.cloud/ipfs/bafybeifk6o7nffgglzh7jm4ml6p357pr436amt5pk7f2xcavcqhpphvptu/circuits/devnet/min_devnet.arcis".to_string(),
                hash: [74, 92, 82, 35, 143, 240, 181, 67, 118, 126, 0, 75, 117, 187, 62, 157, 28, 130, 111, 229, 103, 120, 235, 253, 176, 189, 25, 147, 123, 146, 39, 167],
            })),
            None,
        )?;
        Ok(())
    }

    pub fn min(
        ctx: Context<Min>,
        computation_offset: u64,
        values: [u8; 32],
        count: [u8; 32],
        pub_key: [u8; 32],
        nonce: u128,
    ) -> Result<()> {
        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;
        let args = vec![
            Argument::ArcisPubkey(pub_key),
            Argument::PlaintextU128(nonce),
            Argument::EncryptedU64(values),
            Argument::EncryptedU8(count),
        ];

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            None,
            vec![MinCallback::callback_ix(&[])],
        )?;

        Ok(())
    }

    #[arcium_callback(encrypted_ix = "min")]
    pub fn min_callback(
        ctx: Context<MinCallback>,
        output: ComputationOutputs<MinOutput>,
    ) -> Result<()> {
        let o = match output {
            ComputationOutputs::Success(MinOutput { field_0 }) => field_0,
            _ => return Err(ErrorCode::AbortedComputation.into()),
        };

        emit!(MinEvent {
            result: o.ciphertexts[0],
            nonce: o.nonce.to_le_bytes(),
        });
        Ok(())
    }

    pub fn init_max_comp_def(ctx: Context<InitMaxCompDef>) -> Result<()> {
        init_offchain_comp_def(
            ctx.accounts,
            true,
            0,
            Some(CircuitSource::OffChain(OffChainCircuitSource {
                source: "https://brown-immense-amphibian-214.mypinata.cloud/ipfs/bafybeifk6o7nffgglzh7jm4ml6p357pr436amt5pk7f2xcavcqhpphvptu/circuits/devnet/max_devnet.arcis".to_string(),
                hash: [79, 125, 166, 245, 145, 226, 109, 49, 113, 146, 40, 191, 8, 72, 114, 242, 121, 170, 34, 202, 78, 194, 16, 179, 180, 7, 66, 116, 149, 212, 191, 191],
            })),
            None,
        )?;
        Ok(())
    }

    pub fn max(
        ctx: Context<Max>,
        computation_offset: u64,
        values: [u8; 32],
        count: [u8; 32],
        pub_key: [u8; 32],
        nonce: u128,
    ) -> Result<()> {
        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;
        let args = vec![
            Argument::ArcisPubkey(pub_key),
            Argument::PlaintextU128(nonce),
            Argument::EncryptedU64(values),
            Argument::EncryptedU8(count),
        ];

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            None,
            vec![MaxCallback::callback_ix(&[])],
        )?;

        Ok(())
    }

    #[arcium_callback(encrypted_ix = "max")]
    pub fn max_callback(
        ctx: Context<MaxCallback>,
        output: ComputationOutputs<MaxOutput>,
    ) -> Result<()> {
        let o = match output {
            ComputationOutputs::Success(MaxOutput { field_0 }) => field_0,
            _ => return Err(ErrorCode::AbortedComputation.into()),
        };

        emit!(MaxEvent {
            result: o.ciphertexts[0],
            nonce: o.nonce.to_le_bytes(),
        });
        Ok(())
    }

    pub fn init_median_comp_def(ctx: Context<InitMedianCompDef>) -> Result<()> {
        init_offchain_comp_def(
            ctx.accounts,
            true,
            0,
            Some(CircuitSource::OffChain(OffChainCircuitSource {
                source: "https://brown-immense-amphibian-214.mypinata.cloud/ipfs/bafybeifk6o7nffgglzh7jm4ml6p357pr436amt5pk7f2xcavcqhpphvptu/circuits/devnet/median_devnet.arcis".to_string(),
                hash: [15, 106, 194, 134, 5, 201, 93, 123, 94, 195, 162, 41, 125, 205, 45, 6, 151, 70, 146, 33, 5, 158, 166, 76, 92, 98, 69, 147, 83, 238, 105, 195],
            })),
            None,
        )?;
        Ok(())
    }

    pub fn median(
        ctx: Context<Median>,
        computation_offset: u64,
        values: [u8; 32],
        count: [u8; 32],
        pub_key: [u8; 32],
        nonce: u128,
    ) -> Result<()> {
        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;
        let args = vec![
            Argument::ArcisPubkey(pub_key),
            Argument::PlaintextU128(nonce),
            Argument::EncryptedU64(values),
            Argument::EncryptedU8(count),
        ];

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            None,
            vec![MedianCallback::callback_ix(&[])],
        )?;

        Ok(())
    }

    #[arcium_callback(encrypted_ix = "median")]
    pub fn median_callback(
        ctx: Context<MedianCallback>,
        output: ComputationOutputs<MedianOutput>,
    ) -> Result<()> {
        let o = match output {
            ComputationOutputs::Success(MedianOutput { field_0 }) => field_0,
            _ => return Err(ErrorCode::AbortedComputation.into()),
        };

        emit!(MedianEvent {
            result: o.ciphertexts[0],
            nonce: o.nonce.to_le_bytes(),
        });
        Ok(())
    }

    pub fn init_weighted_average_comp_def(ctx: Context<InitWeightedAverageCompDef>) -> Result<()> {
        init_offchain_comp_def(
            ctx.accounts,
            true,
            0,
            Some(CircuitSource::OffChain(OffChainCircuitSource {
                source: "https://brown-immense-amphibian-214.mypinata.cloud/ipfs/bafybeifk6o7nffgglzh7jm4ml6p357pr436amt5pk7f2xcavcqhpphvptu/circuits/devnet/weighted_average_devnet.arcis".to_string(),
                hash: [37, 248, 234, 72, 8, 91, 226, 223, 118, 251, 40, 136, 118, 72, 53, 19, 58, 201, 52, 163, 61, 41, 238, 26, 84, 202, 153, 11, 0, 53, 77, 135],
            })),
            None,
        )?;
        Ok(())
    }

    pub fn weighted_average(
        ctx: Context<WeightedAverage>,
        computation_offset: u64,
        values: [u8; 32],
        count: [u8; 32],
        pub_key: [u8; 32],
        nonce: u128,
    ) -> Result<()> {
        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;
        let args = vec![
            Argument::ArcisPubkey(pub_key),
            Argument::PlaintextU128(nonce),
            Argument::EncryptedU64(values),
            Argument::EncryptedU8(count),
        ];

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            None,
            vec![WeightedAverageCallback::callback_ix(&[])],
        )?;

        Ok(())
    }

    #[arcium_callback(encrypted_ix = "weighted_average")]
    pub fn weighted_average_callback(
        ctx: Context<WeightedAverageCallback>,
        output: ComputationOutputs<WeightedAverageOutput>,
    ) -> Result<()> {
        let o = match output {
            ComputationOutputs::Success(WeightedAverageOutput { field_0 }) => field_0,
            _ => return Err(ErrorCode::AbortedComputation.into()),
        };

        emit!(WeightedAverageEvent {
            result: o.ciphertexts[0],
            nonce: o.nonce.to_le_bytes(),
        });
        Ok(())
    }

    pub fn init_credit_score_comp_def(ctx: Context<InitCreditScoreCompDef>) -> Result<()> {
        init_offchain_comp_def(
            ctx.accounts,
            true,
            0,
            Some(CircuitSource::OffChain(OffChainCircuitSource {
                source: "https://brown-immense-amphibian-214.mypinata.cloud/ipfs/bafybeifk6o7nffgglzh7jm4ml6p357pr436amt5pk7f2xcavcqhpphvptu/circuits/devnet/credit_score_devnet.arcis".to_string(),
                hash: [80, 158, 20, 106, 37, 111, 80, 22, 247, 144, 40, 63, 225, 14, 173, 209, 180, 113, 154, 5, 231, 147, 145, 225, 56, 168, 127, 150, 180, 48, 114, 74],
            })),
            None,
        )?;
        Ok(())
    }

    pub fn credit_score(
        ctx: Context<CreditScore>,
        computation_offset: u64,
        ciphertext_0: [u8; 32],
        ciphertext_1: [u8; 32],
        ciphertext_2: [u8; 32],
        ciphertext_3: [u8; 32],
        pub_key: [u8; 32],
        nonce: u128,
    ) -> Result<()> {
        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;
        let args = vec![
            Argument::ArcisPubkey(pub_key),
            Argument::PlaintextU128(nonce),
            Argument::EncryptedU64(ciphertext_0),
            Argument::EncryptedU64(ciphertext_1),
            Argument::EncryptedU8(ciphertext_2),
            Argument::EncryptedU8(ciphertext_3),
        ];

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            None,
            vec![CreditScoreCallback::callback_ix(&[])],
        )?;

        Ok(())
    }

    #[arcium_callback(encrypted_ix = "credit_score")]
    pub fn credit_score_callback(
        ctx: Context<CreditScoreCallback>,
        output: ComputationOutputs<CreditScoreOutput>,
    ) -> Result<()> {
        let o = match output {
            ComputationOutputs::Success(CreditScoreOutput { field_0 }) => field_0,
            _ => return Err(ErrorCode::AbortedComputation.into()),
        };

        emit!(CreditScoreEvent {
            score: o.ciphertexts[0],
            approved: o.ciphertexts[1],
            nonce: o.nonce.to_le_bytes(),
        });
        Ok(())
    }

    pub fn init_health_risk_comp_def(ctx: Context<InitHealthRiskCompDef>) -> Result<()> {
        init_offchain_comp_def(
            ctx.accounts,
            true,
            0,
            Some(CircuitSource::OffChain(OffChainCircuitSource {
                source: "https://brown-immense-amphibian-214.mypinata.cloud/ipfs/bafybeifk6o7nffgglzh7jm4ml6p357pr436amt5pk7f2xcavcqhpphvptu/circuits/devnet/health_risk_devnet.arcis".to_string(),
                hash: [88, 39, 225, 157, 73, 6, 175, 140, 99, 24, 112, 227, 53, 53, 17, 148, 131, 208, 190, 216, 156, 5, 8, 180, 193, 239, 12, 118, 74, 18, 48, 71],
            })),
            None,
        )?;
        Ok(())
    }

    pub fn health_risk(
        ctx: Context<HealthRisk>,
        computation_offset: u64,
        ciphertext_0: [u8; 32],
        ciphertext_1: [u8; 32],
        ciphertext_2: [u8; 32],
        ciphertext_3: [u8; 32],
        ciphertext_4: [u8; 32],
        pub_key: [u8; 32],
        nonce: u128,
    ) -> Result<()> {
        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;
        let args = vec![
            Argument::ArcisPubkey(pub_key),
            Argument::PlaintextU128(nonce),
            Argument::EncryptedU8(ciphertext_0),
            Argument::EncryptedU8(ciphertext_1),
            Argument::EncryptedU8(ciphertext_2),
            Argument::EncryptedU8(ciphertext_3),
            Argument::EncryptedU8(ciphertext_4),
        ];

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            None,
            vec![HealthRiskCallback::callback_ix(&[])],
        )?;

        Ok(())
    }

    #[arcium_callback(encrypted_ix = "health_risk")]
    pub fn health_risk_callback(
        ctx: Context<HealthRiskCallback>,
        output: ComputationOutputs<HealthRiskOutput>,
    ) -> Result<()> {
        let o = match output {
            ComputationOutputs::Success(HealthRiskOutput { field_0 }) => field_0,
            _ => return Err(ErrorCode::AbortedComputation.into()),
        };

        emit!(HealthRiskEvent {
            risk_score: o.ciphertexts[0],
            risk_category: o.ciphertexts[1],
            nonce: o.nonce.to_le_bytes(),
        });
        Ok(())
    }
}


#[queue_computation_accounts("add", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct Add<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, SignerAccount>,
    #[account(
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(
        mut,
        address = derive_mempool_pda!()
    )]
    /// CHECK: mempool_account, checked by the arcium program.
    pub mempool_account: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_execpool_pda!()
    )]
    /// CHECK: executing_pool, checked by the arcium program.
    pub executing_pool: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_comp_pda!(computation_offset)
    )]
    /// CHECK: computation_account, checked by the arcium program.
    pub computation_account: UncheckedAccount<'info>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_ADD)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account)
    )]
    pub cluster_account: Box<Account<'info, Cluster>>,
    #[account(
        mut,
        address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS,
    )]
    pub pool_account: Box<Account<'info, FeePool>>,
    #[account(
        address = ARCIUM_CLOCK_ACCOUNT_ADDRESS
    )]
    pub clock_account: Box<Account<'info, ClockAccount>>,
    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

#[callback_accounts("add")]
#[derive(Accounts)]
pub struct AddCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_ADD)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by the account constraint
    pub instructions_sysvar: AccountInfo<'info>,
}

#[init_computation_definition_accounts("add", payer)]
#[derive(Accounts)]
pub struct InitAddCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut)]
    /// CHECK: comp_def_account, checked by arcium program.
    pub comp_def_account: UncheckedAccount<'info>,
    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct AddEvent {
    pub result: [u8; 32],
    pub nonce: [u8; 16],
}

#[queue_computation_accounts("subtract", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct Subtract<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, SignerAccount>,
    #[account(
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(
        mut,
        address = derive_mempool_pda!()
    )]
    /// CHECK: mempool_account, checked by the arcium program.
    pub mempool_account: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_execpool_pda!()
    )]
    /// CHECK: executing_pool, checked by the arcium program.
    pub executing_pool: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_comp_pda!(computation_offset)
    )]
    /// CHECK: computation_account, checked by the arcium program.
    pub computation_account: UncheckedAccount<'info>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_SUBTRACT)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account)
    )]
    pub cluster_account: Box<Account<'info, Cluster>>,
    #[account(
        mut,
        address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS,
    )]
    pub pool_account: Box<Account<'info, FeePool>>,
    #[account(
        address = ARCIUM_CLOCK_ACCOUNT_ADDRESS
    )]
    pub clock_account: Box<Account<'info, ClockAccount>>,
    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

#[callback_accounts("subtract")]
#[derive(Accounts)]
pub struct SubtractCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_SUBTRACT)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by the account constraint
    pub instructions_sysvar: AccountInfo<'info>,
}

#[init_computation_definition_accounts("subtract", payer)]
#[derive(Accounts)]
pub struct InitSubtractCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut)]
    /// CHECK: comp_def_account, checked by arcium program.
    pub comp_def_account: UncheckedAccount<'info>,
    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct SubtractEvent {
    pub result: [u8; 32],
    pub nonce: [u8; 16],
}

#[queue_computation_accounts("multiply", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct Multiply<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, SignerAccount>,
    #[account(
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(
        mut,
        address = derive_mempool_pda!()
    )]
    /// CHECK: mempool_account, checked by the arcium program.
    pub mempool_account: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_execpool_pda!()
    )]
    /// CHECK: executing_pool, checked by the arcium program.
    pub executing_pool: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_comp_pda!(computation_offset)
    )]
    /// CHECK: computation_account, checked by the arcium program.
    pub computation_account: UncheckedAccount<'info>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_MULTIPLY)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account)
    )]
    pub cluster_account: Box<Account<'info, Cluster>>,
    #[account(
        mut,
        address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS,
    )]
    pub pool_account: Box<Account<'info, FeePool>>,
    #[account(
        address = ARCIUM_CLOCK_ACCOUNT_ADDRESS
    )]
    pub clock_account: Box<Account<'info, ClockAccount>>,
    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

#[callback_accounts("multiply")]
#[derive(Accounts)]
pub struct MultiplyCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_MULTIPLY)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by the account constraint
    pub instructions_sysvar: AccountInfo<'info>,
}

#[init_computation_definition_accounts("multiply", payer)]
#[derive(Accounts)]
pub struct InitMultiplyCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut)]
    /// CHECK: comp_def_account, checked by arcium program.
    pub comp_def_account: UncheckedAccount<'info>,
    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct MultiplyEvent {
    pub result: [u8; 32],
    pub nonce: [u8; 16],
}

#[queue_computation_accounts("divide", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct Divide<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, SignerAccount>,
    #[account(
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(
        mut,
        address = derive_mempool_pda!()
    )]
    /// CHECK: mempool_account, checked by the arcium program.
    pub mempool_account: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_execpool_pda!()
    )]
    /// CHECK: executing_pool, checked by the arcium program.
    pub executing_pool: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_comp_pda!(computation_offset)
    )]
    /// CHECK: computation_account, checked by the arcium program.
    pub computation_account: UncheckedAccount<'info>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_DIVIDE)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account)
    )]
    pub cluster_account: Box<Account<'info, Cluster>>,
    #[account(
        mut,
        address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS,
    )]
    pub pool_account: Box<Account<'info, FeePool>>,
    #[account(
        address = ARCIUM_CLOCK_ACCOUNT_ADDRESS
    )]
    pub clock_account: Box<Account<'info, ClockAccount>>,
    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

#[callback_accounts("divide")]
#[derive(Accounts)]
pub struct DivideCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_DIVIDE)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by the account constraint
    pub instructions_sysvar: AccountInfo<'info>,
}

#[init_computation_definition_accounts("divide", payer)]
#[derive(Accounts)]
pub struct InitDivideCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut)]
    /// CHECK: comp_def_account, checked by arcium program.
    pub comp_def_account: UncheckedAccount<'info>,
    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct DivideEvent {
    pub result: [u8; 32],
    pub nonce: [u8; 16],
}

#[queue_computation_accounts("modulo", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct Modulo<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, SignerAccount>,
    #[account(
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(
        mut,
        address = derive_mempool_pda!()
    )]
    /// CHECK: mempool_account, checked by the arcium program.
    pub mempool_account: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_execpool_pda!()
    )]
    /// CHECK: executing_pool, checked by the arcium program.
    pub executing_pool: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_comp_pda!(computation_offset)
    )]
    /// CHECK: computation_account, checked by the arcium program.
    pub computation_account: UncheckedAccount<'info>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_MODULO)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account)
    )]
    pub cluster_account: Box<Account<'info, Cluster>>,
    #[account(
        mut,
        address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS,
    )]
    pub pool_account: Box<Account<'info, FeePool>>,
    #[account(
        address = ARCIUM_CLOCK_ACCOUNT_ADDRESS
    )]
    pub clock_account: Box<Account<'info, ClockAccount>>,
    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

#[callback_accounts("modulo")]
#[derive(Accounts)]
pub struct ModuloCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_MODULO)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by the account constraint
    pub instructions_sysvar: AccountInfo<'info>,
}

#[init_computation_definition_accounts("modulo", payer)]
#[derive(Accounts)]
pub struct InitModuloCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut)]
    /// CHECK: comp_def_account, checked by arcium program.
    pub comp_def_account: UncheckedAccount<'info>,
    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct ModuloEvent {
    pub result: [u8; 32],
    pub nonce: [u8; 16],
}

#[queue_computation_accounts("abs_diff", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct AbsDiff<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, SignerAccount>,
    #[account(
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(
        mut,
        address = derive_mempool_pda!()
    )]
    /// CHECK: mempool_account, checked by the arcium program.
    pub mempool_account: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_execpool_pda!()
    )]
    /// CHECK: executing_pool, checked by the arcium program.
    pub executing_pool: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_comp_pda!(computation_offset)
    )]
    /// CHECK: computation_account, checked by the arcium program.
    pub computation_account: UncheckedAccount<'info>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_ABS_DIFF)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account)
    )]
    pub cluster_account: Box<Account<'info, Cluster>>,
    #[account(
        mut,
        address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS,
    )]
    pub pool_account: Box<Account<'info, FeePool>>,
    #[account(
        address = ARCIUM_CLOCK_ACCOUNT_ADDRESS
    )]
    pub clock_account: Box<Account<'info, ClockAccount>>,
    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

#[callback_accounts("abs_diff")]
#[derive(Accounts)]
pub struct AbsDiffCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_ABS_DIFF)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by the account constraint
    pub instructions_sysvar: AccountInfo<'info>,
}

#[init_computation_definition_accounts("abs_diff", payer)]
#[derive(Accounts)]
pub struct InitAbsDiffCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut)]
    /// CHECK: comp_def_account, checked by arcium program.
    pub comp_def_account: UncheckedAccount<'info>,
    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct AbsDiffEvent {
    pub result: [u8; 32],
    pub nonce: [u8; 16],
}

#[queue_computation_accounts("power", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct Power<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, SignerAccount>,
    #[account(
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(
        mut,
        address = derive_mempool_pda!()
    )]
    /// CHECK: mempool_account, checked by the arcium program.
    pub mempool_account: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_execpool_pda!()
    )]
    /// CHECK: executing_pool, checked by the arcium program.
    pub executing_pool: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_comp_pda!(computation_offset)
    )]
    /// CHECK: computation_account, checked by the arcium program.
    pub computation_account: UncheckedAccount<'info>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_POWER)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account)
    )]
    pub cluster_account: Box<Account<'info, Cluster>>,
    #[account(
        mut,
        address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS,
    )]
    pub pool_account: Box<Account<'info, FeePool>>,
    #[account(
        address = ARCIUM_CLOCK_ACCOUNT_ADDRESS
    )]
    pub clock_account: Box<Account<'info, ClockAccount>>,
    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

#[callback_accounts("power")]
#[derive(Accounts)]
pub struct PowerCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_POWER)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by the account constraint
    pub instructions_sysvar: AccountInfo<'info>,
}

#[init_computation_definition_accounts("power", payer)]
#[derive(Accounts)]
pub struct InitPowerCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut)]
    /// CHECK: comp_def_account, checked by arcium program.
    pub comp_def_account: UncheckedAccount<'info>,
    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct PowerEvent {
    pub result: [u8; 32],
    pub nonce: [u8; 16],
}

#[queue_computation_accounts("greater_than", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct GreaterThan<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, SignerAccount>,
    #[account(
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(
        mut,
        address = derive_mempool_pda!()
    )]
    /// CHECK: mempool_account, checked by the arcium program.
    pub mempool_account: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_execpool_pda!()
    )]
    /// CHECK: executing_pool, checked by the arcium program.
    pub executing_pool: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_comp_pda!(computation_offset)
    )]
    /// CHECK: computation_account, checked by the arcium program.
    pub computation_account: UncheckedAccount<'info>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_GREATER_THAN)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account)
    )]
    pub cluster_account: Box<Account<'info, Cluster>>,
    #[account(
        mut,
        address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS,
    )]
    pub pool_account: Box<Account<'info, FeePool>>,
    #[account(
        address = ARCIUM_CLOCK_ACCOUNT_ADDRESS
    )]
    pub clock_account: Box<Account<'info, ClockAccount>>,
    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

#[callback_accounts("greater_than")]
#[derive(Accounts)]
pub struct GreaterThanCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_GREATER_THAN)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by the account constraint
    pub instructions_sysvar: AccountInfo<'info>,
}

#[init_computation_definition_accounts("greater_than", payer)]
#[derive(Accounts)]
pub struct InitGreaterThanCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut)]
    /// CHECK: comp_def_account, checked by arcium program.
    pub comp_def_account: UncheckedAccount<'info>,
    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct GreaterThanEvent {
    pub result: [u8; 32],
    pub nonce: [u8; 16],
}

#[queue_computation_accounts("less_than", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct LessThan<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, SignerAccount>,
    #[account(
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(
        mut,
        address = derive_mempool_pda!()
    )]
    /// CHECK: mempool_account, checked by the arcium program.
    pub mempool_account: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_execpool_pda!()
    )]
    /// CHECK: executing_pool, checked by the arcium program.
    pub executing_pool: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_comp_pda!(computation_offset)
    )]
    /// CHECK: computation_account, checked by the arcium program.
    pub computation_account: UncheckedAccount<'info>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_LESS_THAN)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account)
    )]
    pub cluster_account: Box<Account<'info, Cluster>>,
    #[account(
        mut,
        address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS,
    )]
    pub pool_account: Box<Account<'info, FeePool>>,
    #[account(
        address = ARCIUM_CLOCK_ACCOUNT_ADDRESS
    )]
    pub clock_account: Box<Account<'info, ClockAccount>>,
    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

#[callback_accounts("less_than")]
#[derive(Accounts)]
pub struct LessThanCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_LESS_THAN)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by the account constraint
    pub instructions_sysvar: AccountInfo<'info>,
}

#[init_computation_definition_accounts("less_than", payer)]
#[derive(Accounts)]
pub struct InitLessThanCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut)]
    /// CHECK: comp_def_account, checked by arcium program.
    pub comp_def_account: UncheckedAccount<'info>,
    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct LessThanEvent {
    pub result: [u8; 32],
    pub nonce: [u8; 16],
}

#[queue_computation_accounts("equal", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct Equal<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, SignerAccount>,
    #[account(
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(
        mut,
        address = derive_mempool_pda!()
    )]
    /// CHECK: mempool_account, checked by the arcium program.
    pub mempool_account: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_execpool_pda!()
    )]
    /// CHECK: executing_pool, checked by the arcium program.
    pub executing_pool: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_comp_pda!(computation_offset)
    )]
    /// CHECK: computation_account, checked by the arcium program.
    pub computation_account: UncheckedAccount<'info>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_EQUAL)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account)
    )]
    pub cluster_account: Box<Account<'info, Cluster>>,
    #[account(
        mut,
        address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS,
    )]
    pub pool_account: Box<Account<'info, FeePool>>,
    #[account(
        address = ARCIUM_CLOCK_ACCOUNT_ADDRESS
    )]
    pub clock_account: Box<Account<'info, ClockAccount>>,
    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

#[callback_accounts("equal")]
#[derive(Accounts)]
pub struct EqualCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_EQUAL)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by the account constraint
    pub instructions_sysvar: AccountInfo<'info>,
}

#[init_computation_definition_accounts("equal", payer)]
#[derive(Accounts)]
pub struct InitEqualCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut)]
    /// CHECK: comp_def_account, checked by arcium program.
    pub comp_def_account: UncheckedAccount<'info>,
    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct EqualEvent {
    pub result: [u8; 32],
    pub nonce: [u8; 16],
}

#[queue_computation_accounts("greater_equal", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct GreaterEqual<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, SignerAccount>,
    #[account(
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(
        mut,
        address = derive_mempool_pda!()
    )]
    /// CHECK: mempool_account, checked by the arcium program.
    pub mempool_account: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_execpool_pda!()
    )]
    /// CHECK: executing_pool, checked by the arcium program.
    pub executing_pool: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_comp_pda!(computation_offset)
    )]
    /// CHECK: computation_account, checked by the arcium program.
    pub computation_account: UncheckedAccount<'info>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_GREATER_EQUAL)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account)
    )]
    pub cluster_account: Box<Account<'info, Cluster>>,
    #[account(
        mut,
        address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS,
    )]
    pub pool_account: Box<Account<'info, FeePool>>,
    #[account(
        address = ARCIUM_CLOCK_ACCOUNT_ADDRESS
    )]
    pub clock_account: Box<Account<'info, ClockAccount>>,
    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

#[callback_accounts("greater_equal")]
#[derive(Accounts)]
pub struct GreaterEqualCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_GREATER_EQUAL)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by the account constraint
    pub instructions_sysvar: AccountInfo<'info>,
}

#[init_computation_definition_accounts("greater_equal", payer)]
#[derive(Accounts)]
pub struct InitGreaterEqualCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut)]
    /// CHECK: comp_def_account, checked by arcium program.
    pub comp_def_account: UncheckedAccount<'info>,
    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct GreaterEqualEvent {
    pub result: [u8; 32],
    pub nonce: [u8; 16],
}

#[queue_computation_accounts("less_equal", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct LessEqual<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, SignerAccount>,
    #[account(
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(
        mut,
        address = derive_mempool_pda!()
    )]
    /// CHECK: mempool_account, checked by the arcium program.
    pub mempool_account: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_execpool_pda!()
    )]
    /// CHECK: executing_pool, checked by the arcium program.
    pub executing_pool: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_comp_pda!(computation_offset)
    )]
    /// CHECK: computation_account, checked by the arcium program.
    pub computation_account: UncheckedAccount<'info>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_LESS_EQUAL)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account)
    )]
    pub cluster_account: Box<Account<'info, Cluster>>,
    #[account(
        mut,
        address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS,
    )]
    pub pool_account: Box<Account<'info, FeePool>>,
    #[account(
        address = ARCIUM_CLOCK_ACCOUNT_ADDRESS
    )]
    pub clock_account: Box<Account<'info, ClockAccount>>,
    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

#[callback_accounts("less_equal")]
#[derive(Accounts)]
pub struct LessEqualCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_LESS_EQUAL)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by the account constraint
    pub instructions_sysvar: AccountInfo<'info>,
}

#[init_computation_definition_accounts("less_equal", payer)]
#[derive(Accounts)]
pub struct InitLessEqualCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut)]
    /// CHECK: comp_def_account, checked by arcium program.
    pub comp_def_account: UncheckedAccount<'info>,
    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct LessEqualEvent {
    pub result: [u8; 32],
    pub nonce: [u8; 16],
}

#[queue_computation_accounts("meets_threshold", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct MeetsThreshold<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, SignerAccount>,
    #[account(
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(
        mut,
        address = derive_mempool_pda!()
    )]
    /// CHECK: mempool_account, checked by the arcium program.
    pub mempool_account: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_execpool_pda!()
    )]
    /// CHECK: executing_pool, checked by the arcium program.
    pub executing_pool: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_comp_pda!(computation_offset)
    )]
    /// CHECK: computation_account, checked by the arcium program.
    pub computation_account: UncheckedAccount<'info>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_MEETS_THRESHOLD)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account)
    )]
    pub cluster_account: Box<Account<'info, Cluster>>,
    #[account(
        mut,
        address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS,
    )]
    pub pool_account: Box<Account<'info, FeePool>>,
    #[account(
        address = ARCIUM_CLOCK_ACCOUNT_ADDRESS
    )]
    pub clock_account: Box<Account<'info, ClockAccount>>,
    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

#[callback_accounts("meets_threshold")]
#[derive(Accounts)]
pub struct MeetsThresholdCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_MEETS_THRESHOLD)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by the account constraint
    pub instructions_sysvar: AccountInfo<'info>,
}

#[init_computation_definition_accounts("meets_threshold", payer)]
#[derive(Accounts)]
pub struct InitMeetsThresholdCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut)]
    /// CHECK: comp_def_account, checked by arcium program.
    pub comp_def_account: UncheckedAccount<'info>,
    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct MeetsThresholdEvent {
    pub result: [u8; 32],
    pub nonce: [u8; 16],
}

#[queue_computation_accounts("in_range", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct InRange<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, SignerAccount>,
    #[account(
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(
        mut,
        address = derive_mempool_pda!()
    )]
    /// CHECK: mempool_account, checked by the arcium program.
    pub mempool_account: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_execpool_pda!()
    )]
    /// CHECK: executing_pool, checked by the arcium program.
    pub executing_pool: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_comp_pda!(computation_offset)
    )]
    /// CHECK: computation_account, checked by the arcium program.
    pub computation_account: UncheckedAccount<'info>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_IN_RANGE)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account)
    )]
    pub cluster_account: Box<Account<'info, Cluster>>,
    #[account(
        mut,
        address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS,
    )]
    pub pool_account: Box<Account<'info, FeePool>>,
    #[account(
        address = ARCIUM_CLOCK_ACCOUNT_ADDRESS
    )]
    pub clock_account: Box<Account<'info, ClockAccount>>,
    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

#[callback_accounts("in_range")]
#[derive(Accounts)]
pub struct InRangeCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_IN_RANGE)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by the account constraint
    pub instructions_sysvar: AccountInfo<'info>,
}

#[init_computation_definition_accounts("in_range", payer)]
#[derive(Accounts)]
pub struct InitInRangeCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut)]
    /// CHECK: comp_def_account, checked by arcium program.
    pub comp_def_account: UncheckedAccount<'info>,
    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct InRangeEvent {
    pub result: [u8; 32],
    pub nonce: [u8; 16],
}

#[queue_computation_accounts("and", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct And<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, SignerAccount>,
    #[account(
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(
        mut,
        address = derive_mempool_pda!()
    )]
    /// CHECK: mempool_account, checked by the arcium program.
    pub mempool_account: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_execpool_pda!()
    )]
    /// CHECK: executing_pool, checked by the arcium program.
    pub executing_pool: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_comp_pda!(computation_offset)
    )]
    /// CHECK: computation_account, checked by the arcium program.
    pub computation_account: UncheckedAccount<'info>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_AND)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account)
    )]
    pub cluster_account: Box<Account<'info, Cluster>>,
    #[account(
        mut,
        address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS,
    )]
    pub pool_account: Box<Account<'info, FeePool>>,
    #[account(
        address = ARCIUM_CLOCK_ACCOUNT_ADDRESS
    )]
    pub clock_account: Box<Account<'info, ClockAccount>>,
    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

#[callback_accounts("and")]
#[derive(Accounts)]
pub struct AndCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_AND)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by the account constraint
    pub instructions_sysvar: AccountInfo<'info>,
}

#[init_computation_definition_accounts("and", payer)]
#[derive(Accounts)]
pub struct InitAndCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut)]
    /// CHECK: comp_def_account, checked by arcium program.
    pub comp_def_account: UncheckedAccount<'info>,
    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct AndEvent {
    pub result: [u8; 32],
    pub nonce: [u8; 16],
}

#[queue_computation_accounts("or", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct Or<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, SignerAccount>,
    #[account(
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(
        mut,
        address = derive_mempool_pda!()
    )]
    /// CHECK: mempool_account, checked by the arcium program.
    pub mempool_account: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_execpool_pda!()
    )]
    /// CHECK: executing_pool, checked by the arcium program.
    pub executing_pool: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_comp_pda!(computation_offset)
    )]
    /// CHECK: computation_account, checked by the arcium program.
    pub computation_account: UncheckedAccount<'info>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_OR)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account)
    )]
    pub cluster_account: Box<Account<'info, Cluster>>,
    #[account(
        mut,
        address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS,
    )]
    pub pool_account: Box<Account<'info, FeePool>>,
    #[account(
        address = ARCIUM_CLOCK_ACCOUNT_ADDRESS
    )]
    pub clock_account: Box<Account<'info, ClockAccount>>,
    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

#[callback_accounts("or")]
#[derive(Accounts)]
pub struct OrCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_OR)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by the account constraint
    pub instructions_sysvar: AccountInfo<'info>,
}

#[init_computation_definition_accounts("or", payer)]
#[derive(Accounts)]
pub struct InitOrCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut)]
    /// CHECK: comp_def_account, checked by arcium program.
    pub comp_def_account: UncheckedAccount<'info>,
    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct OrEvent {
    pub result: [u8; 32],
    pub nonce: [u8; 16],
}

#[queue_computation_accounts("xor", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct Xor<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, SignerAccount>,
    #[account(
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(
        mut,
        address = derive_mempool_pda!()
    )]
    /// CHECK: mempool_account, checked by the arcium program.
    pub mempool_account: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_execpool_pda!()
    )]
    /// CHECK: executing_pool, checked by the arcium program.
    pub executing_pool: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_comp_pda!(computation_offset)
    )]
    /// CHECK: computation_account, checked by the arcium program.
    pub computation_account: UncheckedAccount<'info>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_XOR)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account)
    )]
    pub cluster_account: Box<Account<'info, Cluster>>,
    #[account(
        mut,
        address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS,
    )]
    pub pool_account: Box<Account<'info, FeePool>>,
    #[account(
        address = ARCIUM_CLOCK_ACCOUNT_ADDRESS
    )]
    pub clock_account: Box<Account<'info, ClockAccount>>,
    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

#[callback_accounts("xor")]
#[derive(Accounts)]
pub struct XorCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_XOR)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by the account constraint
    pub instructions_sysvar: AccountInfo<'info>,
}

#[init_computation_definition_accounts("xor", payer)]
#[derive(Accounts)]
pub struct InitXorCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut)]
    /// CHECK: comp_def_account, checked by arcium program.
    pub comp_def_account: UncheckedAccount<'info>,
    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct XorEvent {
    pub result: [u8; 32],
    pub nonce: [u8; 16],
}

#[queue_computation_accounts("not", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct Not<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, SignerAccount>,
    #[account(
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(
        mut,
        address = derive_mempool_pda!()
    )]
    /// CHECK: mempool_account, checked by the arcium program.
    pub mempool_account: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_execpool_pda!()
    )]
    /// CHECK: executing_pool, checked by the arcium program.
    pub executing_pool: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_comp_pda!(computation_offset)
    )]
    /// CHECK: computation_account, checked by the arcium program.
    pub computation_account: UncheckedAccount<'info>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_NOT)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account)
    )]
    pub cluster_account: Box<Account<'info, Cluster>>,
    #[account(
        mut,
        address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS,
    )]
    pub pool_account: Box<Account<'info, FeePool>>,
    #[account(
        address = ARCIUM_CLOCK_ACCOUNT_ADDRESS
    )]
    pub clock_account: Box<Account<'info, ClockAccount>>,
    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

#[callback_accounts("not")]
#[derive(Accounts)]
pub struct NotCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_NOT)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by the account constraint
    pub instructions_sysvar: AccountInfo<'info>,
}

#[init_computation_definition_accounts("not", payer)]
#[derive(Accounts)]
pub struct InitNotCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut)]
    /// CHECK: comp_def_account, checked by arcium program.
    pub comp_def_account: UncheckedAccount<'info>,
    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct NotEvent {
    pub result: [u8; 32],
    pub nonce: [u8; 16],
}

#[queue_computation_accounts("if_else", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct IfElse<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, SignerAccount>,
    #[account(
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(
        mut,
        address = derive_mempool_pda!()
    )]
    /// CHECK: mempool_account, checked by the arcium program.
    pub mempool_account: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_execpool_pda!()
    )]
    /// CHECK: executing_pool, checked by the arcium program.
    pub executing_pool: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_comp_pda!(computation_offset)
    )]
    /// CHECK: computation_account, checked by the arcium program.
    pub computation_account: UncheckedAccount<'info>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_IF_ELSE)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account)
    )]
    pub cluster_account: Box<Account<'info, Cluster>>,
    #[account(
        mut,
        address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS,
    )]
    pub pool_account: Box<Account<'info, FeePool>>,
    #[account(
        address = ARCIUM_CLOCK_ACCOUNT_ADDRESS
    )]
    pub clock_account: Box<Account<'info, ClockAccount>>,
    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

#[callback_accounts("if_else")]
#[derive(Accounts)]
pub struct IfElseCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_IF_ELSE)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by the account constraint
    pub instructions_sysvar: AccountInfo<'info>,
}

#[init_computation_definition_accounts("if_else", payer)]
#[derive(Accounts)]
pub struct InitIfElseCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut)]
    /// CHECK: comp_def_account, checked by arcium program.
    pub comp_def_account: UncheckedAccount<'info>,
    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct IfElseEvent {
    pub result: [u8; 32],
    pub nonce: [u8; 16],
}

#[queue_computation_accounts("vote_tally", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct VoteTally<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, SignerAccount>,
    #[account(
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(
        mut,
        address = derive_mempool_pda!()
    )]
    /// CHECK: mempool_account, checked by the arcium program.
    pub mempool_account: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_execpool_pda!()
    )]
    /// CHECK: executing_pool, checked by the arcium program.
    pub executing_pool: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_comp_pda!(computation_offset)
    )]
    /// CHECK: computation_account, checked by the arcium program.
    pub computation_account: UncheckedAccount<'info>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_VOTE_TALLY)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account)
    )]
    pub cluster_account: Box<Account<'info, Cluster>>,
    #[account(
        mut,
        address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS,
    )]
    pub pool_account: Box<Account<'info, FeePool>>,
    #[account(
        address = ARCIUM_CLOCK_ACCOUNT_ADDRESS
    )]
    pub clock_account: Box<Account<'info, ClockAccount>>,
    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

#[callback_accounts("vote_tally")]
#[derive(Accounts)]
pub struct VoteTallyCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_VOTE_TALLY)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by the account constraint
    pub instructions_sysvar: AccountInfo<'info>,
}

#[init_computation_definition_accounts("vote_tally", payer)]
#[derive(Accounts)]
pub struct InitVoteTallyCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut)]
    /// CHECK: comp_def_account, checked by arcium program.
    pub comp_def_account: UncheckedAccount<'info>,
    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct VoteTallyEvent {
    pub result: [u8; 32],
    pub nonce: [u8; 16],
}

#[queue_computation_accounts("average", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct Average<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, SignerAccount>,
    #[account(
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(
        mut,
        address = derive_mempool_pda!()
    )]
    /// CHECK: mempool_account, checked by the arcium program.
    pub mempool_account: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_execpool_pda!()
    )]
    /// CHECK: executing_pool, checked by the arcium program.
    pub executing_pool: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_comp_pda!(computation_offset)
    )]
    /// CHECK: computation_account, checked by the arcium program.
    pub computation_account: UncheckedAccount<'info>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_AVERAGE)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account)
    )]
    pub cluster_account: Box<Account<'info, Cluster>>,
    #[account(
        mut,
        address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS,
    )]
    pub pool_account: Box<Account<'info, FeePool>>,
    #[account(
        address = ARCIUM_CLOCK_ACCOUNT_ADDRESS
    )]
    pub clock_account: Box<Account<'info, ClockAccount>>,
    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

#[callback_accounts("average")]
#[derive(Accounts)]
pub struct AverageCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_AVERAGE)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by the account constraint
    pub instructions_sysvar: AccountInfo<'info>,
}

#[init_computation_definition_accounts("average", payer)]
#[derive(Accounts)]
pub struct InitAverageCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut)]
    /// CHECK: comp_def_account, checked by arcium program.
    pub comp_def_account: UncheckedAccount<'info>,
    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct AverageEvent {
    pub result: [u8; 32],
    pub nonce: [u8; 16],
}

#[queue_computation_accounts("sum", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct Sum<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, SignerAccount>,
    #[account(
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(
        mut,
        address = derive_mempool_pda!()
    )]
    /// CHECK: mempool_account, checked by the arcium program.
    pub mempool_account: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_execpool_pda!()
    )]
    /// CHECK: executing_pool, checked by the arcium program.
    pub executing_pool: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_comp_pda!(computation_offset)
    )]
    /// CHECK: computation_account, checked by the arcium program.
    pub computation_account: UncheckedAccount<'info>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_SUM)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account)
    )]
    pub cluster_account: Box<Account<'info, Cluster>>,
    #[account(
        mut,
        address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS,
    )]
    pub pool_account: Box<Account<'info, FeePool>>,
    #[account(
        address = ARCIUM_CLOCK_ACCOUNT_ADDRESS
    )]
    pub clock_account: Box<Account<'info, ClockAccount>>,
    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

#[callback_accounts("sum")]
#[derive(Accounts)]
pub struct SumCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_SUM)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by the account constraint
    pub instructions_sysvar: AccountInfo<'info>,
}

#[init_computation_definition_accounts("sum", payer)]
#[derive(Accounts)]
pub struct InitSumCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut)]
    /// CHECK: comp_def_account, checked by arcium program.
    pub comp_def_account: UncheckedAccount<'info>,
    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct SumEvent {
    pub result: [u8; 32],
    pub nonce: [u8; 16],
}

#[queue_computation_accounts("min", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct Min<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, SignerAccount>,
    #[account(
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(
        mut,
        address = derive_mempool_pda!()
    )]
    /// CHECK: mempool_account, checked by the arcium program.
    pub mempool_account: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_execpool_pda!()
    )]
    /// CHECK: executing_pool, checked by the arcium program.
    pub executing_pool: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_comp_pda!(computation_offset)
    )]
    /// CHECK: computation_account, checked by the arcium program.
    pub computation_account: UncheckedAccount<'info>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_MIN)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account)
    )]
    pub cluster_account: Box<Account<'info, Cluster>>,
    #[account(
        mut,
        address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS,
    )]
    pub pool_account: Box<Account<'info, FeePool>>,
    #[account(
        address = ARCIUM_CLOCK_ACCOUNT_ADDRESS
    )]
    pub clock_account: Box<Account<'info, ClockAccount>>,
    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

#[callback_accounts("min")]
#[derive(Accounts)]
pub struct MinCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_MIN)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by the account constraint
    pub instructions_sysvar: AccountInfo<'info>,
}

#[init_computation_definition_accounts("min", payer)]
#[derive(Accounts)]
pub struct InitMinCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut)]
    /// CHECK: comp_def_account, checked by arcium program.
    pub comp_def_account: UncheckedAccount<'info>,
    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct MinEvent {
    pub result: [u8; 32],
    pub nonce: [u8; 16],
}

#[queue_computation_accounts("max", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct Max<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, SignerAccount>,
    #[account(
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(
        mut,
        address = derive_mempool_pda!()
    )]
    /// CHECK: mempool_account, checked by the arcium program.
    pub mempool_account: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_execpool_pda!()
    )]
    /// CHECK: executing_pool, checked by the arcium program.
    pub executing_pool: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_comp_pda!(computation_offset)
    )]
    /// CHECK: computation_account, checked by the arcium program.
    pub computation_account: UncheckedAccount<'info>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_MAX)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account)
    )]
    pub cluster_account: Box<Account<'info, Cluster>>,
    #[account(
        mut,
        address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS,
    )]
    pub pool_account: Box<Account<'info, FeePool>>,
    #[account(
        address = ARCIUM_CLOCK_ACCOUNT_ADDRESS
    )]
    pub clock_account: Box<Account<'info, ClockAccount>>,
    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

#[callback_accounts("max")]
#[derive(Accounts)]
pub struct MaxCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_MAX)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by the account constraint
    pub instructions_sysvar: AccountInfo<'info>,
}

#[init_computation_definition_accounts("max", payer)]
#[derive(Accounts)]
pub struct InitMaxCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut)]
    /// CHECK: comp_def_account, checked by arcium program.
    pub comp_def_account: UncheckedAccount<'info>,
    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct MaxEvent {
    pub result: [u8; 32],
    pub nonce: [u8; 16],
}

#[queue_computation_accounts("median", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct Median<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, SignerAccount>,
    #[account(
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(
        mut,
        address = derive_mempool_pda!()
    )]
    /// CHECK: mempool_account, checked by the arcium program.
    pub mempool_account: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_execpool_pda!()
    )]
    /// CHECK: executing_pool, checked by the arcium program.
    pub executing_pool: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_comp_pda!(computation_offset)
    )]
    /// CHECK: computation_account, checked by the arcium program.
    pub computation_account: UncheckedAccount<'info>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_MEDIAN)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account)
    )]
    pub cluster_account: Box<Account<'info, Cluster>>,
    #[account(
        mut,
        address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS,
    )]
    pub pool_account: Box<Account<'info, FeePool>>,
    #[account(
        address = ARCIUM_CLOCK_ACCOUNT_ADDRESS
    )]
    pub clock_account: Box<Account<'info, ClockAccount>>,
    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

#[callback_accounts("median")]
#[derive(Accounts)]
pub struct MedianCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_MEDIAN)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by the account constraint
    pub instructions_sysvar: AccountInfo<'info>,
}

#[init_computation_definition_accounts("median", payer)]
#[derive(Accounts)]
pub struct InitMedianCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut)]
    /// CHECK: comp_def_account, checked by arcium program.
    pub comp_def_account: UncheckedAccount<'info>,
    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct MedianEvent {
    pub result: [u8; 32],
    pub nonce: [u8; 16],
}

#[queue_computation_accounts("weighted_average", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct WeightedAverage<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, SignerAccount>,
    #[account(
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(
        mut,
        address = derive_mempool_pda!()
    )]
    /// CHECK: mempool_account, checked by the arcium program.
    pub mempool_account: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_execpool_pda!()
    )]
    /// CHECK: executing_pool, checked by the arcium program.
    pub executing_pool: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_comp_pda!(computation_offset)
    )]
    /// CHECK: computation_account, checked by the arcium program.
    pub computation_account: UncheckedAccount<'info>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_WEIGHTED_AVERAGE)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account)
    )]
    pub cluster_account: Box<Account<'info, Cluster>>,
    #[account(
        mut,
        address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS,
    )]
    pub pool_account: Box<Account<'info, FeePool>>,
    #[account(
        address = ARCIUM_CLOCK_ACCOUNT_ADDRESS
    )]
    pub clock_account: Box<Account<'info, ClockAccount>>,
    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

#[callback_accounts("weighted_average")]
#[derive(Accounts)]
pub struct WeightedAverageCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_WEIGHTED_AVERAGE)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by the account constraint
    pub instructions_sysvar: AccountInfo<'info>,
}

#[init_computation_definition_accounts("weighted_average", payer)]
#[derive(Accounts)]
pub struct InitWeightedAverageCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut)]
    /// CHECK: comp_def_account, checked by arcium program.
    pub comp_def_account: UncheckedAccount<'info>,
    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct WeightedAverageEvent {
    pub result: [u8; 32],
    pub nonce: [u8; 16],
}

#[queue_computation_accounts("credit_score", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct CreditScore<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, SignerAccount>,
    #[account(
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(
        mut,
        address = derive_mempool_pda!()
    )]
    /// CHECK: mempool_account, checked by the arcium program.
    pub mempool_account: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_execpool_pda!()
    )]
    /// CHECK: executing_pool, checked by the arcium program.
    pub executing_pool: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_comp_pda!(computation_offset)
    )]
    /// CHECK: computation_account, checked by the arcium program.
    pub computation_account: UncheckedAccount<'info>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_CREDIT_SCORE)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account)
    )]
    pub cluster_account: Box<Account<'info, Cluster>>,
    #[account(
        mut,
        address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS,
    )]
    pub pool_account: Box<Account<'info, FeePool>>,
    #[account(
        address = ARCIUM_CLOCK_ACCOUNT_ADDRESS
    )]
    pub clock_account: Box<Account<'info, ClockAccount>>,
    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

#[callback_accounts("credit_score")]
#[derive(Accounts)]
pub struct CreditScoreCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_CREDIT_SCORE)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by the account constraint
    pub instructions_sysvar: AccountInfo<'info>,
}

#[init_computation_definition_accounts("credit_score", payer)]
#[derive(Accounts)]
pub struct InitCreditScoreCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut)]
    /// CHECK: comp_def_account, checked by arcium program.
    pub comp_def_account: UncheckedAccount<'info>,
    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct CreditScoreEvent {
    pub score: [u8; 32],
    pub approved: [u8; 32],
    pub nonce: [u8; 16],
}

#[queue_computation_accounts("health_risk", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct HealthRisk<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, SignerAccount>,
    #[account(
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(
        mut,
        address = derive_mempool_pda!()
    )]
    /// CHECK: mempool_account, checked by the arcium program.
    pub mempool_account: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_execpool_pda!()
    )]
    /// CHECK: executing_pool, checked by the arcium program.
    pub executing_pool: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_comp_pda!(computation_offset)
    )]
    /// CHECK: computation_account, checked by the arcium program.
    pub computation_account: UncheckedAccount<'info>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_HEALTH_RISK)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account)
    )]
    pub cluster_account: Box<Account<'info, Cluster>>,
    #[account(
        mut,
        address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS,
    )]
    pub pool_account: Box<Account<'info, FeePool>>,
    #[account(
        address = ARCIUM_CLOCK_ACCOUNT_ADDRESS
    )]
    pub clock_account: Box<Account<'info, ClockAccount>>,
    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

#[callback_accounts("health_risk")]
#[derive(Accounts)]
pub struct HealthRiskCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_HEALTH_RISK)
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by the account constraint
    pub instructions_sysvar: AccountInfo<'info>,
}

#[init_computation_definition_accounts("health_risk", payer)]
#[derive(Accounts)]
pub struct InitHealthRiskCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut)]
    /// CHECK: comp_def_account, checked by arcium program.
    pub comp_def_account: UncheckedAccount<'info>,
    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct HealthRiskEvent {
    pub risk_score: [u8; 32],
    pub risk_category: [u8; 32],
    pub nonce: [u8; 16],
}

#[error_code]
pub enum ErrorCode {
    #[msg("The computation was aborted")]
    AbortedComputation,
    #[msg("Cluster not set")]
    ClusterNotSet,
}

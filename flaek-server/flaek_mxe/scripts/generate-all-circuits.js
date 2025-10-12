const fs = require('fs');
const path = require('path');

// Circuit definitions with their input/output types
const CIRCUITS = {
  add: { inputs: [{type: 'u64'}, {type: 'u64'}], outputs: 1, outputType: 'u64' },
  subtract: { inputs: [{type: 'u64'}, {type: 'u64'}], outputs: 1, outputType: 'u64' },
  multiply: { inputs: [{type: 'u64'}, {type: 'u64'}], outputs: 1, outputType: 'u64' },
  divide: { inputs: [{type: 'u64'}, {type: 'u64'}], outputs: 1, outputType: 'u64' },
  modulo: { inputs: [{type: 'u64'}, {type: 'u64'}], outputs: 1, outputType: 'u64' },
  abs_diff: { inputs: [{type: 'u64'}, {type: 'u64'}], outputs: 1, outputType: 'u64' },
  power: { inputs: [{type: 'u64'}, {type: 'u8'}], outputs: 1, outputType: 'u64' },
  greater_than: { inputs: [{type: 'u64'}, {type: 'u64'}], outputs: 1, outputType: 'u8' },
  less_than: { inputs: [{type: 'u64'}, {type: 'u64'}], outputs: 1, outputType: 'u8' },
  equal: { inputs: [{type: 'u64'}, {type: 'u64'}], outputs: 1, outputType: 'u8' },
  greater_equal: { inputs: [{type: 'u64'}, {type: 'u64'}], outputs: 1, outputType: 'u8' },
  less_equal: { inputs: [{type: 'u64'}, {type: 'u64'}], outputs: 1, outputType: 'u8' },
  meets_threshold: { inputs: [{type: 'u64'}, {type: 'u64'}], outputs: 1, outputType: 'u8' },
  in_range: { inputs: [{type: 'u64'}, {type: 'u64'}, {type: 'u64'}], outputs: 1, outputType: 'u8' },
  and: { inputs: [{type: 'u8'}, {type: 'u8'}], outputs: 1, outputType: 'u8' },
  or: { inputs: [{type: 'u8'}, {type: 'u8'}], outputs: 1, outputType: 'u8' },
  xor: { inputs: [{type: 'u8'}, {type: 'u8'}], outputs: 1, outputType: 'u8' },
  not: { inputs: [{type: 'u8'}], outputs: 1, outputType: 'u8' },
  if_else: { inputs: [{type: 'u8'}, {type: 'u64'}, {type: 'u64'}], outputs: 1, outputType: 'u64' },
  vote_tally: { inputs: [{type: 'u8'}], outputs: 1, outputType: 'u8' },
  average: { inputs: 'array', outputs: 1, outputType: 'u64' },
  sum: { inputs: 'array', outputs: 1, outputType: 'u64' },
  min: { inputs: 'array', outputs: 1, outputType: 'u64' },
  max: { inputs: 'array', outputs: 1, outputType: 'u64' },
  median: { inputs: 'array', outputs: 1, outputType: 'u64' },
  weighted_average: { inputs: 'weighted', outputs: 1, outputType: 'u64' },
  credit_score: { inputs: [{type: 'u64'}, {type: 'u64'}, {type: 'u8'}, {type: 'u8'}], outputs: 2, outputType: 'multi', special: 'credit' },
  health_risk: { inputs: [{type: 'u8'}, {type: 'u8'}, {type: 'u8'}, {type: 'u8'}, {type: 'u8'}], outputs: 2, outputType: 'multi', special: 'health' },
};

function snakeToCamel(str) {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}

function snakeToPascal(str) {
  const camel = snakeToCamel(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

function snakeToUpperSnake(str) {
  return str.toUpperCase();
}

function generateCiphertextParams(config) {
  if (config.inputs === 'array' || config.inputs === 'weighted') {
    return 'values: [u8; 32],\n        count: [u8; 32]';
  }
  
  const params = [];
  for (let i = 0; i < config.inputs.length; i++) {
    params.push(`ciphertext_${i}: [u8; 32]`);
  }
  return params.join(',\n        ');
}

function generateArguments(config) {
  if (config.inputs === 'array' || config.inputs === 'weighted') {
    return `            Argument::EncryptedU64(values),
            Argument::EncryptedU8(count)`;
  }
  
  const args = [];
  for (let i = 0; i < config.inputs.length; i++) {
    const type = config.inputs[i].type;
    const argType = type === 'u8' ? 'EncryptedU8' : 
                    type === 'u16' ? 'EncryptedU16' :
                    type === 'u32' ? 'EncryptedU32' :
                    type === 'u64' ? 'EncryptedU64' :
                    type === 'u128' ? 'EncryptedU128' : 'EncryptedU8';
    args.push(`Argument::${argType}(ciphertext_${i})`);
  }
  return args.map(a => `            ${a}`).join(',\n');
}

function generateEventFields(config, circuitName) {
  if (config.outputs === 1) {
    return '    pub result: [u8; 32],\n    pub nonce: [u8; 16],';
  } else if (config.special === 'credit') {
    return '    pub score: [u8; 32],\n    pub approved: [u8; 32],\n    pub nonce: [u8; 16],';
  } else if (config.special === 'health') {
    return '    pub risk_score: [u8; 32],\n    pub risk_category: [u8; 32],\n    pub nonce: [u8; 16],';
  }
  return '    pub result: [u8; 32],\n    pub nonce: [u8; 16],';
}

function generateEmitBody(config, pascalName) {
  if (config.outputs === 1) {
    return `        emit!(${pascalName}Event {
            result: o.ciphertexts[0],
            nonce: o.nonce.to_le_bytes(),
        });`;
  } else if (config.special === 'credit') {
    return `        emit!(${pascalName}Event {
            score: o.ciphertexts[0],
            approved: o.ciphertexts[1],
            nonce: o.nonce.to_le_bytes(),
        });`;
  } else if (config.special === 'health') {
    return `        emit!(${pascalName}Event {
            risk_score: o.ciphertexts[0],
            risk_category: o.ciphertexts[1],
            nonce: o.nonce.to_le_bytes(),
        });`;
  }
  return `        emit!(${pascalName}Event {
            result: o.ciphertexts[0],
            nonce: o.nonce.to_le_bytes(),
        });`;
}

function generateCircuitCode(circuitName, config) {
  const pascalName = snakeToPascal(circuitName);
  const upperSnakeName = snakeToUpperSnake(circuitName);
  const ciphertextParams = generateCiphertextParams(config);
  const arguments = generateArguments(config);
  const emitBody = generateEmitBody(config, pascalName);
  
  return `
    pub fn init_${circuitName}_comp_def(ctx: Context<Init${pascalName}CompDef>) -> Result<()> {
        init_comp_def(ctx.accounts, true, 0, None, None)?;
        Ok(())
    }

    pub fn ${circuitName}(
        ctx: Context<${pascalName}>,
        computation_offset: u64,
        ${ciphertextParams},
        pub_key: [u8; 32],
        nonce: u128,
    ) -> Result<()> {
        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;
        let args = vec![
            Argument::ArcisPubkey(pub_key),
            Argument::PlaintextU128(nonce),
${arguments},
        ];

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            None,
            vec![${pascalName}Callback::callback_ix(&[])],
        )?;

        Ok(())
    }

    #[arcium_callback(encrypted_ix = "${circuitName}")]
    pub fn ${circuitName}_callback(
        ctx: Context<${pascalName}Callback>,
        output: ComputationOutputs<${pascalName}Output>,
    ) -> Result<()> {
        let o = match output {
            ComputationOutputs::Success(${pascalName}Output { field_0 }) => field_0,
            _ => return Err(ErrorCode::AbortedComputation.into()),
        };

${emitBody}
        Ok(())
    }
`;
}

function generateAccountStructs(circuitName, config) {
  const pascalName = snakeToPascal(circuitName);
  const upperSnakeName = snakeToUpperSnake(circuitName);
  const eventFields = generateEventFields(config, circuitName);
  
  return `
#[queue_computation_accounts("${circuitName}", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct ${pascalName}<'info> {
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
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_${upperSnakeName})
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

#[callback_accounts("${circuitName}")]
#[derive(Accounts)]
pub struct ${pascalName}Callback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_${upperSnakeName})
    )]
    pub comp_def_account: Box<Account<'info, ComputationDefinitionAccount>>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by the account constraint
    pub instructions_sysvar: AccountInfo<'info>,
}

#[init_computation_definition_accounts("${circuitName}", payer)]
#[derive(Accounts)]
pub struct Init${pascalName}CompDef<'info> {
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
pub struct ${pascalName}Event {
${eventFields}
}
`;
}

function generateAllCircuits() {
  console.log('Generating ALL 28 circuits with proper Arcium structure...\n');
  
  let moduleCode = '';
  let accountCode = '';
  
  let count = 0;
  for (const [circuitName, config] of Object.entries(CIRCUITS)) {
    console.log(`✓ Generating: ${circuitName}`);
    moduleCode += generateCircuitCode(circuitName, config);
    accountCode += generateAccountStructs(circuitName, config);
    count++;
  }
  
  // Build the complete lib.rs
  const completeCode = `use anchor_lang::prelude::*;
use arcium_anchor::prelude::*;

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

declare_id!("F1aQdsqtKM61djxRgUwKy4SS5BTKVDtgoK5vYkvL62B6");

#[arcium_program]
pub mod flaek_mxe {
    use super::*;
${moduleCode}}

${accountCode}
#[error_code]
pub enum ErrorCode {
    #[msg("The computation was aborted")]
    AbortedComputation,
    #[msg("Cluster not set")]
    ClusterNotSet,
}
`;
  
  // Write to file
  const outputPath = path.join(__dirname, '..', 'programs', 'flaek_mxe', 'src', 'lib.rs');
  fs.writeFileSync(outputPath, completeCode);
  
  console.log(`\n✅ Generated complete integration for ${count} circuits`);
  console.log(`✅ Written to: ${outputPath}`);
  console.log(`\nFile statistics:`);
  console.log(`  - Total lines: ${completeCode.split('\n').length}`);
  console.log(`  - Module code: ${moduleCode.split('\n').length} lines`);
  console.log(`  - Account structs: ${accountCode.split('\n').length} lines`);
  console.log('\nNext steps:');
  console.log('1. Run: arcium build');
  console.log('2. Run: arcium deploy --cluster-offset 1078779259 --keypair-path ~/.config/solana/id.json -u d --skip-init');
  console.log('3. Run: ANCHOR_PROVIDER_URL=https://api.devnet.solana.com ANCHOR_WALLET=~/.config/solana/id.json yarn ts-node scripts/init-all-circuits.ts');
}

generateAllCircuits();

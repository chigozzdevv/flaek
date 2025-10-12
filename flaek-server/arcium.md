# Intro to Arcium

Arcium is a decentralized private computation network that enables secure processing of encrypted data through Multi-Party Computation (MPC). It solves a fundamental problem in Web3: how to process sensitive data while maintaining privacy. Traditionally, computation requires data to be decrypted, making it vulnerable to attacks and exposing private information. Arcium changes this by allowing computations to run on fully encrypted data.

## What Arcium Enables

As a Solana developer, Arcium gives you the ability to:

1. **Build Privacy-Preserving Applications**: Add privacy to your applications without adopting a new blockchain, programming language, or workflow. Arcium maintains full composability within familiar ecosystems.
2. **Use Familiar Tooling**: Leverage the Arcis framework, which extends Solana's Anchor tooling. Built in Rust, it allows you to add privacy simply by marking functions as confidential—no cryptography knowledge required.
3. **Process Sensitive Data**: Run computations on encrypted data without ever decrypting it. This means sensitive information like user balances, trade orders, or personal data can be processed securely.

## How It Works

Your application (MXE) works with encrypted data in three simple steps:

1. Client encrypts data and sends it to your MXE program
2. Your program submits the computation to Arcium's network of MPC nodes
3. Nodes process the data while keeping it encrypted, then return the results

The entire process happens on-chain through Solana, with each step verified and coordinated by Arcium's programs. For larger computations, an optional callback server handles results that don't fit in a single transaction.

## Common Use Cases

1. **Private DeFi**: Build dark pools, aka private order books, where trade sizes and prices remain hidden, enabling truly permissionless confidential trading without front-running or market manipulation.
2. **Secure AI**: Enable AI model inference and training on sensitive data while keeping the data encrypted.
3. **Confidential Gaming**: Build hidden information games where player moves and state remain private until revealed (e.g., card games, strategy games, auctions).

## Getting Started

Arcium provides a familiar development experience for Solana developers:

* Use the `arcium` CLI (a wrapper over `anchor` CLI) to build Solana programs with Arcium
* Write confidential instructions in Rust using the Arcis framework
* Integrate with your Solana programs using the TypeScript client library

Follow these steps to get started:

1. [Install Arcium](https://docs.arcium.com/developers/installation) - Set up the development environment and tools
2. [Hello World](https://docs.arcium.com/developers/hello-world) - Create your first confidential instruction
3. [Computation Lifecycle](https://docs.arcium.com/developers/computation-lifecycle) - Understand how confidential computations work
4. [TypeScript SDK Reference](https://ts.arcium.com/api) - Complete API documentation for TypeScript client libraries

The network is currently in Public Testnet. Join our [Discord](https://discord.com/invite/arcium) to join our community and start building.

# Installation

## Quick Install (Recommended)

On Mac and Linux, run this single command to install Arcium:

```bash
curl --proto '=https' --tlsv1.2 -sSfL https://install.arcium.com/ | bash
```

`arcup` is a tool for managing versioning of the Arcium tooling (including the CLI and Arx Node). More info on it can be found [here](https://docs.arcium.com/developers/installation/arcup).

This script will:

* Check for all required dependencies
* Install Linux build dependencies automatically (if needed)
* Download and install `arcup` for your platform
* Install the latest Arcium CLI (command-line interface for interacting with the Arcium network and managing computations)
* Install the Arx Node (the core node software that performs encrypted computations in the network)

### Prerequisites

Before running the installation script, make sure you have these dependencies installed:

* **Rust**: Install from [here](https://www.rust-lang.org/tools/install)
* **Solana CLI**: Install from [here](https://docs.solana.com/cli/install-solana-cli-tools), then run `solana-keygen new`
* **Yarn**: Install from [here](https://yarnpkg.com/getting-started/install)
* **Anchor**: Install from [here](https://www.anchor-lang.com/docs/installation)
* **Docker & Docker Compose**: Install Docker from [here](https://docs.docker.com/engine/install/) and Docker Compose from [here](https://docs.docker.com/compose/install/)

The installation script will check for all these dependencies and provide clear instructions if any are missing.

## Manual Installation

If you prefer to install manually, you can still use the traditional method. arcup is a tool for managing versioning of the arcium tooling (including the CLI and Arx Node). More info on it can be found [here](https://docs.arcium.com/developers/installation/arcup).

Install `arcup`. We currently support 4 pre-built targets, listed below. We do not support Windows at the moment.

* `aarch64_linux`
* `x86_64_linux`
* `aarch64_macos`
* `x86_64_macos`

You can install it by replacing `<YOUR_TARGET>` with the target you want to install, and running the following command:

{% tabs %}
{% tab title="Arch Linux" %}

```bash
TARGET=aarch64_linux && curl "https://bin.arcium.com/download/arcup_${TARGET}_0.3.0" -o ~/.cargo/bin/arcup && chmod +x ~/.cargo/bin/arcup
```

{% endtab %}

{% tab title="x86 Linux" %}

```bash
TARGET=x86_64_linux && curl "https://bin.arcium.com/download/arcup_${TARGET}_0.3.0" -o ~/.cargo/bin/arcup && chmod +x ~/.cargo/bin/arcup
```

{% endtab %}

{% tab title="Apple Silicon" %}

```bash
TARGET=aarch64_macos && curl "https://bin.arcium.com/download/arcup_${TARGET}_0.3.0" -o ~/.cargo/bin/arcup && chmod +x ~/.cargo/bin/arcup
```

{% endtab %}

{% tab title="Intel Mac" %}

```bash
TARGET=x86_64_macos && curl "https://bin.arcium.com/download/arcup_${TARGET}_0.3.0" -o ~/.cargo/bin/arcup && chmod +x ~/.cargo/bin/arcup
```

{% endtab %}
{% endtabs %}

Install the latest version of the CLI using `arcup`:

```bash
arcup install
```

Verify the installation:

```bash
arcium --version
```

## Issues

Installation might fail due to a variety of reasons. This section contains a list of the most common issues and their solutions, taken from anchor's installation guide.

### Platform-Specific Issues

**Windows Users:** Arcium is not currently supported on Windows. We recommend using Windows Subsystem for Linux (WSL2) with Ubuntu for the best experience.

**Linux Systems:** You may need additional dependencies. On Ubuntu/Debian:

```bash
sudo apt-get update && sudo apt-get upgrade && sudo apt-get install -y pkg-config build-essential libudev-dev libssl-dev
```

### Incorrect `$PATH`

Rust binaries, including `arcup` and `arcium`, are installed to the `~/.cargo/bin` directory. Since this directory is required to be in the `PATH` environment variable, Rust installation tries to set it up automatically, but it might fail to do so on some platforms.

To verify that the `PATH` environment variable was set up correctly, run:

```shell
which arcium
```

The output should look like (with your username):

```
/home/user/.cargo/bin/arcium
```

**Shell-Specific PATH Issues:**

If `which arcium` returns nothing, add the cargo bin directory to your PATH:

* **Bash/Zsh:** Add to `~/.bashrc` or `~/.zshrc`:

  ```bash
  export PATH="$HOME/.cargo/bin:$PATH"
  ```
* **Fish:** Add to `~/.config/fish/config.fish`:

  ```bash
  set -gx PATH $HOME/.cargo/bin $PATH
  ```

After editing, restart your terminal or run `source ~/.bashrc` (or equivalent for your shell).

# Arcup Version Manager

The `arcup` version manager enables easy installation and management of the Arcium Networks' tooling suite, consisting of the Arcium CLI binary, the Arx Node Docker image, and the Postgres Docker image (needed to run the Callback Server). With a single command you can install all of the necessary tools, as well as update all of them when there are new releases.

The [Quick Start](#quick-start) section below takes you through basic `arcup` onboarding, however you can find more detailed installation instructions [here](https://docs.arcium.com/developers/installation). Also, see the [Versioning section below](#inter-component-versioning) for details on how versioning is handled between the different components of the Arcium Network.

## Quick Start

First, delete any local versions of the CLI, or Arx Node (Docker) that you may currently have installed on your machine (if you don't have any currently installed, you can skip this step):

```bash
rm $HOME/.cargo/bin/arcium
docker images | grep "arcium-hq" | awk '{print $1":"$2}' | xargs docker rmi -f
```

Verify that you do not have any versions of the CLI, or Arx Node (Docker) installed on your machine now:

```bash
arcium --version # Should return "No such file or directory"
docker images # Should not show any arcium-related images
```

Next, install `arcup` on your machine by following [these steps](https://docs.arcium.com/developers/installation/..#installation). Then run the `arcup` install command:

```bash
arcup install # Will install the latest releases of the Arcium components
```

Now verify that everything is installed correctly:

```bash
arcium --version # Should show the latest CLI version
arcup version # Shows the currently installed versions of all of the Arcium components
docker images # Should list the images for the Arx Node, and Postgres
```

You can also install older versions using the `install` command (and specifying a version), as well as deleting installed versions with the `delete` command, and switching between already installed versions using the `use` command. See the [Available Commands](#available-commands) section below for full details.

## Inter-Component Versioning

The `arcup` version manager is based on [semver](https://semver.org/) (`MAJOR.MINOR.PATCH`). With `arcup`, the `PATCH` version number need not be in-sync across the different components, however the `MAJOR.MINOR` version number will always be in-sync across all of the Arcium components. As such, `PATCH` changes are always non-breaking with respect to the other Arcium components.

For example, if the current versions are:

* CLI: `0.2.4`
* Arx Node: `0.2.15`

If a breaking change is made to the CLI (e.g. increment to `0.3.0`), the `MINOR` version number of Nodes is also incremented (so both would become `0.3.0`). However, if only a (non-breaking) `PATCH` upgrade is made to tooling, then tooling would increment to `0.2.5` and node would remain unchanged.

## Available Commands

```bash
install  Install the latest (or a specific) version of Arcium components (Arx Node and CLI)
update   Update all Arcium components (Arx Node and CLI) to the latest version
list     List all installed versions
version  Show currently active version
use      Switch to using a specific installed version
delete   Delete a specific version
help     Print this message or the help of the given subcommand(s)
```

# Hello World with Arcium

## Hello World

The Arcium tooling suite for writing MXEs (MPC eXecution Environments) is built on top of [Anchor](https://www.anchor-lang.com/), so if you're familiar with Anchor, you should find Arcium to be a familiar experience, except that you're using the `arcium` CLI instead of `anchor`.

To initialize a new MXE project, you can therefore simply run:

```bash
arcium init <project-name>
```

This will create a new project with the given name, and initialize it with a basic structure. The structure is the same as in an Anchor project with two differences, so we won't repeat it here (for an explanation of the Anchor project structure, see the [Anchor documentation](https://www.anchor-lang.com/docs/quickstart/local)). The two differences are:

* The `Arcium.toml` file, which contains the configuration for the Arcium tooling suite.
* The `encrypted-ixs` directory. This is where we write all our code that is meant to operate on encrypted data and therefore runs in MPC. This code is written using our own Rust framework called [Arcis](https://docs.arcium.com/developers/arcis). This will already be populated with a simple example called `add_together.rs`. Let's take a closer look at it.

### Our first encrypted instruction

```rust
use arcis_imports::*;

#[encrypted]
mod circuits {
    use arcis_imports::*;

    pub struct InputValues {
        v1: u8,
        v2: u8,
    }

    #[instruction]
    pub fn add_together(input_ctxt: Enc<Shared, InputValues>) -> Enc<Shared, u16> {
        let input = input_ctxt.to_arcis();
        let sum = input.v1 as u16 + input.v2 as u16;
        input_ctxt.owner.from_arcis(sum)
    }
}
```

Let's go through it line by line. `use arcis_imports::*;` imports all the necessary types and functions for writing encrypted instructions with Arcis. The `#[encrypted]` attribute marks a module that contains encrypted instructions. Inside this module, we define a struct `InputValues` that contains the two values we want to encrypt and pass to the encrypted instruction.

The `#[instruction]` macro marks the function as an entry point for MPC execution - while you can write helper functions without this attribute, only functions marked with `#[instruction]` will be compiled into individual circuits that can be called onchain.

The function `add_together` takes an encrypted input parameter of type `Enc<Shared, InputValues>`. Let's break this down:

* `Enc<Owner, Data>` is Arcium's encrypted data type
* `Shared` means the data is encrypted with a shared secret between the client and MXE (both can decrypt it)
* `InputValues` is the actual data structure being encrypted (our struct with v1 and v2)
* The alternative to `Shared` is `Mxe`, where only the MXE can decrypt the data

Inside the function:

1. `input_ctxt.to_arcis()` converts the input into a form we can operate on within the MPC environment.
2. We perform the addition operation, casting the u8 values to u16 to prevent overflow.
3. `input_ctxt.owner.from_arcis(sum)` converts the encrypted sum into an encrypted format that can be stored onchain, while maintaining encryption with the shared secret between the client and the MXE.

### Calling it from Solana

Now that we've written our first confidential instruction, let's see how can use it from within a Solana program. Our default project already contains a Solana program in the `programs/` directory. Let's take a closer look at it too:

```rust
use anchor_lang::prelude::*;
use arcium_anchor::prelude::*;

// This constant identifies our encrypted instruction for on-chain operations
// comp_def_offset() generates a unique identifier from the function name
const COMP_DEF_OFFSET_ADD_TOGETHER: u32 = comp_def_offset("add_together");

declare_id!("YOUR_PROGRAM_ID_HERE");

#[arcium_program]
pub mod hello_world {
    use super::*;

    pub fn init_add_together_comp_def(ctx: Context<InitAddTogetherCompDef>) -> Result<()> {
        init_comp_def(ctx.accounts, true, 0, None, None)?;
        Ok(())
    }

    pub fn add_together(
        ctx: Context<AddTogether>,
        computation_offset: u64,
        ciphertext_0: [u8; 32],
        ciphertext_1: [u8; 32],
        pub_key: [u8; 32],
        nonce: u128,
    ) -> Result<()> {
        let args = vec![
            Argument::ArcisPubkey(pub_key),
            Argument::PlaintextU128(nonce),
            Argument::EncryptedU8(ciphertext_0),
            Argument::EncryptedU8(ciphertext_1),
        ];

        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            None,
            vec![AddTogetherCallback::callback_ix(&[])],
        )?;
        Ok(())
    }

    #[arcium_callback(encrypted_ix = "add_together")]
    pub fn add_together_callback(
        ctx: Context<AddTogetherCallback>,
        output: ComputationOutputs<AddTogetherOutput>,
    ) -> Result<()> {
        let o = match output {
            ComputationOutputs::Success(AddTogetherOutput { field_0 }) => field_0,
            _ => return Err(ErrorCode::AbortedComputation.into()),
        };

        emit!(SumEvent {
            sum: o.ciphertexts[0],
            nonce: o.nonce.to_le_bytes(),
        });
        Ok(())
    }
}
```

For the sake of brevity, we don't include the `InitAddTogetherCompDef`, `AddTogether`, and `AddTogetherCallback` account structs here, but they're automatically generated when you run `arcium init`. Here's a simplified version of what `AddTogether` looks like:

```rust
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct AddTogether<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    // ... other required Arcium accounts (see program/ section for full details)
}
```

You can read more about them and the invokation of confidential instructions inside solana programs [here](https://docs.arcium.com/developers/program).

The key things to note here are that every mxe program is identified by the `#[arcium_program]` macro (which replaces anchor's `#[program]` macro) and that for every confidential instruction, we generally have three instructions in our solana program:

* `init_add_together_comp_def`: This is the instruction that initializes the confidential instruction definition. It is used to set up the computation definition and is therefore only called once prior to the first invocation of the confidential instruction. More info on this can be found [here](https://docs.arcium.com/developers/program/computation-def-accs).
* `add_together`: This is the instruction that invokes the confidential instruction. It takes in the arguments for the confidential instruction and queues it for execution using the Arcium program. More info on this can be found [here](https://docs.arcium.com/developers/program).
* `add_together_callback`: This is the instruction that is called by the MPC cluster when the confidential instruction has finished executing which returns our result. More info on this can be found [here](https://docs.arcium.com/developers/program).

This is due to the general flow of computations throughout Arcium, which you can read more about [here](https://docs.arcium.com/developers/computation-lifecycle).

## Building and testing

Similar to anchor, we can build the confidential instructions and Solana programs using `arcium build`. Testing is done using the `@arcium-hq/client` typescript library (more info on it can be found [here](https://docs.arcium.com/developers/js-client-library)) by default and can be run using `arcium test` (make sure you have installed the npm dependencies prior by running `yarn` or `npm install` in your project directory).

Let's take a quick look at the default test file. Note that some helper functions and imports are excluded for brevity, but you can find the complete examples in your generated project:

```typescript
describe("Hello World", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.HelloWorld as Program<HelloWorld>;
  const provider = anchor.getProvider();

  const arciumEnv = getArciumEnv();

  it("Is initialized!", async () => {
    const owner = readKpJson(`${os.homedir()}/.config/solana/id.json`);

    console.log("Initializing add together computation definition");
    const initATSig = await initAddTogetherCompDef(program, owner, false);
    console.log(
      "Add together computation definition initialized with signature",
      initATSig
    );

    const privateKey = x25519.utils.randomSecretKey();
    const publicKey = x25519.getPublicKey(privateKey);
    const mxePublicKey = await getMXEPublicKeyWithRetry(
      provider as anchor.AnchorProvider,
      program.programId
    );

    console.log("MXE x25519 pubkey is", mxePublicKey);
    const sharedSecret = x25519.getSharedSecret(privateKey, mxePublicKey);
    const cipher = new RescueCipher(sharedSecret);

    const val1 = BigInt(1);
    const val2 = BigInt(2);
    const plaintext = [val1, val2];

    const nonce = randomBytes(16);
    const ciphertext = cipher.encrypt(plaintext, nonce);

    const sumEventPromise = awaitEvent("sumEvent");
    const computationOffset = new anchor.BN(randomBytes(8), "hex");

    const queueSig = await program.methods
      .addTogether(
        computationOffset,
        Array.from(ciphertext[0]),
        Array.from(ciphertext[1]),
        Array.from(publicKey),
        new anchor.BN(deserializeLE(nonce).toString())
      )
      .accountsPartial({
        computationAccount: getComputationAccAddress(
          program.programId,
          computationOffset
        ),
        clusterAccount: arciumEnv.arciumClusterPubkey,
        mxeAccount: getMXEAccAddress(program.programId),
        mempoolAccount: getMempoolAccAddress(program.programId),
        executingPool: getExecutingPoolAccAddress(program.programId),
        compDefAccount: getCompDefAccAddress(
          program.programId,
          Buffer.from(getCompDefAccOffset("add_together")).readUInt32LE()
        ),
      })
      .rpc({ commitment: "confirmed" });
    console.log("Queue sig is ", queueSig);

    const finalizeSig = await awaitComputationFinalization(
      provider as anchor.AnchorProvider,
      computationOffset,
      program.programId,
      "confirmed"
    );
    console.log("Finalize sig is ", finalizeSig);

    const sumEvent = await sumEventPromise;
    const decrypted = cipher.decrypt([sumEvent.sum], sumEvent.nonce)[0];
    expect(decrypted).to.equal(val1 + val2);
  });
});
```

This test demonstrates the complete flow of encrypted computations in Arcium. Here's what each key step does:

* `initAddTogetherCompDef`: Call the `init_add_together_comp_def` instruction to initialize the confidential instruction definition. (only need to be called once after the program is deployed)
* `getMXEPublicKeyWithRetry`: Fetch the MXE's x25519 public key.
* `x25519.utils.randomSecretKey`: Generate a random private key for the x25519 key exchange.
* `x25519.getPublicKey`: Generate the public key corresponding to the private key we generated above.
* `x25519.getSharedSecret`: Generate the shared secret with the MXE cluster using a x25519 key exchange.
* `cipher = new RescueCipher(sharedSecret)`: Initialize the Rescue cipher (the constructor internally performs a HKDF with HMAC based on the Rescue-Prime hash function, you can learn more [here](https://docs.arcium.com/developers/encryption))
* `cipher.encrypt`: Encrypt the inputs for the confidential instruction.
* `awaitEvent`: Wait for the `sumEvent` event to be emitted by the program on finalization of the computation (in the callback instruction).
* `addTogether`: Call the `add_together` instruction to invoke the confidential instruction.
* `awaitComputationFinalization`: Since waiting for an Arcium computation isn't the same as waiting for one Solana transaction (since we need to wait for the MPC cluster to finish the computation and invoke the callback), we wait using this function, which is provided by the Arcium typescript library.

## Ready to Deploy?

Now that you've built and tested your MXE locally, you're probably eager to see it running on devnet! Head over to our [deployment guide](https://docs.arcium.com/developers/deployment) where we'll walk you through getting your MXE live on Solana devnet. We'll cover everything from choosing the right RPC endpoint to initializing your computation definitions.

## What's Next?

Now that you've built your first MXE, you're ready to deploy it to testnet. Follow the [deployment guide](https://docs.arcium.com/developers/deployment) to get your MXE running on Solana devnet and test with real encrypted computations.

From there, you can build more sophisticated applications by learning about [input/output patterns](https://docs.arcium.com/developers/arcis/input-output) for working with encrypted data, [callback accounts](https://docs.arcium.com/developers/program/callback-accs) for persistent state, and [JavaScript client integration](https://docs.arcium.com/developers/js-client-library/encrypting) for frontend development.

For inspiration, browse our [examples repo](https://github.com/arcium-hq/examples/) to see voting systems, games, and DeFi applications built with Arcium. If you need help, join our [Discord community](https://discord.gg/arcium) where other builders share tips and get support.

# Arcium Computation Lifecycle

Before diving into the details of the tooling, it's useful to understand the general architecture of Arcium. The below diagram gives a high-level overview of the lifecycle of a typical interaction with Arcium (we call these "computations").

{% @mermaid/diagram content="sequenceDiagram
participant Client
participant MXE Program
participant Arcium Program
participant MPC Cluster
participant Callback Server

```
Client->>Client: Encrypt params
Client->>MXE Program: Invoke computation with encrypted params
MXE Program->>Arcium Program: Handle & format params and send to Arcium Program
Arcium Program->>Arcium Program: Queue Computation in MXE's Mempool
MPC Cluster->>Arcium Program: Fetch new computation from mempool
MPC Cluster->>MPC Cluster: Compute using MPC
MPC Cluster->>Arcium Program: Callback with Result
MPC Cluster->>Callback Server: Send additional data (if any)
Callback Server->>Callback Server: Handle data update to on-chain accounts
Callback Server->>MXE Program: Invoke callback instruction (if additional data was sent)
Arcium Program->>Arcium Program: Verify Result
Arcium Program->>MXE Program: Invoke callback instruction with result
MXE Program->>MXE Program: Handle Result
MXE Program->>Client: Notify of completion" %}
```

We have 4 key actors here (with one additional participant if needed):

* The client: The party that wants to perform a computation, usually the user of your MXE. This is implemented using the [Arcium TypeScript Client Library](https://docs.arcium.com/developers/broken-reference).
* The MXE Program: Your app. An MXE (MPC eXecution Environment) consists of everything needed to perform computations and is implemented using the [Arcium program tooling](https://docs.arcium.com/developers/broken-reference):
  * A smart contract that is deployed on the blockchain and is used to format, submit submit computations to Arcium.
  * A set of confidential instructions (we call these "computation definitions") that are used to define what parameters are needed for the computation and what the computation is. Writing these is done using [Arcis](https://docs.arcium.com/developers/arcis).
  * Some metadata about the MXE, most importantly the MPC cluster we would like to use to compute our computations.
* The Arcium Program: The program in charge of assigning, scheduling, and verifying computations for the various MPC clusters to perform.
* The MPC Cluster: The parties that are performing the client's computations using MPC.
* The Callback Server: A server that is used to handle additional data from the MPC cluster. This is optional and only needed for cases when the computation result is more than what can fit in a single Solana transaction.

# Encryption

Encrypted data is passed as an `Enc<Owner, T>` generic type, where `Owner` specifies who can decrypt the data (either `Shared` or `Mxe`), and `T` is the underlying data type being encrypted. In the case of `Mxe`, the nodes collectively can decrypt the data under dishonest majority assumptions, whereas if the `Owner` is `Shared`, then the data was encrypted using a shared secret between the user and the MXE. Underneath the hood, this generic wrapper type contains the encrypted data, as well as the public key (only for `Shared` owner) and nonce used to encrypt the data.

Encrypted data can be decrypted globally or selectively to a given user. For global decryption, you can call `reveal` method on any variable of [supported data type](https://docs.arcium.com/developers/arcis/types). Read more about how we enable this using re-encryption (aka sealing) in Arcium [here](https://docs.arcium.com/developers/encryption/sealing).

Private inputs are encrypted using the arithmetization-oriented symmetric [Rescue cipher](https://eprint.iacr.org/2019/426). Prior to the encryption, a [x25519](https://www.rfc-editor.org/rfc/rfc7748.html#page-7) elliptic curve Diffie-Hellman key exchange is performed between the client and the cluster to derive a common shared secret. The Rescue key is obtained by applying the [HKDF](https://datatracker.ietf.org/doc/html/rfc5869) key derivation to the shared secret. This increases the min-entropy of the key.\
Note:

1. Since the x25519 key exchange natively returns shared secrets in the finite field with $$p = 2^{255} - 19$$ elements, we implemented Rescue over the field $$\mathbb{F}\_{p}$$. States in the context of Rescue are elements of the $$m$$-dimensional vector space $$\mathbb{F}\_p^m$$, i.e., the Rescue cipher transforms vectors of size $$m$$ to vectors of the same size.
2. The security level $$s$$ of the cipher is set to 128 bits.
3. We use the Rescue block cipher in [Counter (CTR) mode](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38a.pdf) (see Section 6.5), with fixed $$m = 5$$. The choice $$m = 5$$ is motivated by the fact that it is the smallest value that attains the minimum of recommended rounds (10), given the fixed finite field and security level. The `counter`s are of the form `[nonce, i, 0, 0, 0]`, where `nonce` are 16 random bytes provided by the user.
4. The hash function used for the key derivation is [Rescue-Prime](https://eprint.iacr.org/2020/1143.pdf) over $$\mathbb{F}\_{2^{255}-19}$$, with $$m = 6$$ and `capacity = 1` (yielding `rate = 5`, which matches the size of the states for the Rescue cipher, see 3.). According to [Section 2.2](https://eprint.iacr.org/2020/1143.pdf), this offers 255 / 2 bits of security against collision, preimage and second-preimage attacks.

The decryption of `input_enc: Enc<Owner, T>` can conveniently be obtained by calling `input_enc.to_arcis()` (the nodes do not learn `input`, they simply convert the ciphertext to secret-shares of `input` by running the Rescue decryption circuit in MPC). If the owner is `Shared`, the MXE and the client perform a key exchange first. Similarly, `owner.from_arcis(output)` encrypts the secret-shared `output` by running the Rescue encryption circuit in MPC.\
Note:

1. After decrypting the user-provided inputs, the MXE increments the `nonce` by 1 and uses it for encrypting the outputs. For the forthcoming interaction with the MXE, a new `nonce` must be provided.
2. The performance will benefit from reducing the number of calls to `owner.from_arcis(..)` (per owner). Ideally, put all data encrypted to `owner` in one struct.

# Sealing aka re-encryption

Suppose you're Alice, and you have secret data onchain, and you want to share it with Bob. Or it could be that you want to compute a function on your sensitive data, and share the result with Bob without revealing the data, or the result to anyone else.

Arcium enables you to re-encrypt any data to a given public key. This is known as "sealing" in cryptography, effectively having the ability to restrict data access and information flow.

This is useful for a variety of reasons, such as compliance, end-to-end privacy, and more.

```rust
#[encrypted]
mod circuits {
    use arcis_imports::*;

    #[instruction]
    pub fn verify_loan_eligibility(
        alice_balance: Enc<Shared, u64>,
        min_balance_required: Enc<Mxe, u64>,
        loan_officer: Shared
    ) -> Enc<Shared, bool> {
        let balance = alice_balance.to_arcis();
        let threshold = min_balance_required.to_arcis();

        // Check if Alice meets minimum balance for loan without revealing her exact balance
        let is_eligible = balance >= threshold;

        // Re-encrypt the result for the loan officer
        loan_officer.from_arcis(is_eligible)
    }
}
```

In this example, we have a confidential function `verify_loan_eligibility` that takes Alice's encrypted balance (encrypted with a shared secret between Alice and the MXE), the minimum balance requirement (encrypted only for the MXE), and a `Shared` type parameter representing the loan officer who will receive the result.

The function checks if Alice meets the minimum balance requirement for loan eligibility without revealing her actual balance to anyone. The boolean result is then re-encrypted specifically for the loan officer using their public key. This way, Alice's financial privacy is preserved - the loan officer only learns whether she's eligible, not her actual balance, and the MPC nodes never see the unencrypted values.

# Arcis

Arcis is a Rust-based framework designed for writing secure multi-party computation (MPC) circuits to be executed on the Arcium network. It provides developers with a powerful and intuitive interface to create privacy-preserving applications that can compute over encrypted data.

## Key Features

* **Rust-based**: Leverage the safety and performance of Rust in your MPC development.
* **Circuit-oriented**: Design and implement MPC circuits with ease.
* **Privacy-focused**: Enable computations on encrypted data without revealing the underlying information.

In the following sections, we'll dive deeper into Arcis' syntax, core components, and best practices for building efficient and secure MPC circuits.

# Operations

## Operations

Arcis supports many of Rust's native operations but extends them to work seamlessly with encrypted data, allowing you to write private computations using familiar Rust syntax. See the tables below for a detailed list of supported and unsupported operations.

### Table of contents

* [Expression support](#expression-support)
  * [Binary expressions](#binary-expressions)
  * [Casts](#cast-expressions)
  * [Literals](#literal-expressions)
  * [Methods](#method-calls)
  * [Paths](#paths)
* [Item support](#item-support)
* [Pattern support](#pattern-support)

## Expression support:

| Expression Name   | Example                        | Support         | Comments                                                                 |
| ----------------- | ------------------------------ | --------------- | ------------------------------------------------------------------------ |
| Array literal     | `[a, b]`                       | Supported       |                                                                          |
| Assignment        | `a = b;`                       | Supported       |                                                                          |
| Async block       | `async { ... }`                | Unsupported     |                                                                          |
| Await             | `foo().await`                  | Unsupported     |                                                                          |
| Binary expression | `a + b`                        | Partial Support | [See table below](#binary-expressions) for supported binary expressions. |
| Block expression  | `{ ... }`                      | Supported       |                                                                          |
| Break             | `break;`                       | Unsupported     |                                                                          |
| Function call     | `f(a, b)`                      | Partial Support | [See table below](#function-calls) for supported functions.              |
| Casts             | `a as u16`                     | Partial Support | [See table below](#cast-expressions) for supported conversions.          |
| Closures          | `\|a, b \| a + b`              | Supported       |                                                                          |
| Const block       | `const { ... }`                | Supported       |                                                                          |
| Continue          | `continue;`                    | Unsupported     |                                                                          |
| Field access/set  | `obj.field`                    | Supported       |                                                                          |
| For loop          | `for i in expr { ... }`        | Supported       | Note that `expr` will have its length known at compile-time.             |
| If                | `if cond { ... } else { ... }` | Supported       | Complexity is in O( then\_block + else\_block).                          |
| Indexing          | `a[idx]`                       | Supported       | Complexity will be in O(`a.len()`) if `idx` isn't known at compile-time. |
| If let            | `if let Some(x) = ...`         | Unsupported     |                                                                          |
| Literals          | `1u128`                        | Partial Support | [See table below](#literal-expressions) for supported literals.          |
| Loops             | `loop { ... }`                 | Unsupported     | Cannot be supported as the number of iterations is not known.            |
| Macros            | `println!("{}", q)`            | Partial Support | [See table below](#macros) for supported macros.                         |
| Match             | `match n { ... }`              | Unsupported     |                                                                          |
| Method calls      | `x.foo(a, b)`                  | Partial Support | [See table below](#method-calls) for supported methods.                  |
| Parentheses       | `(a + b)`                      | Supported       |                                                                          |
| Paths             | `Foo::bar`                     | Partial Support | [See table below](#paths) for supported paths.                           |
| Ranges            | `4..5`                         | Partial Support | Not supported in `arr[4..16]`.                                           |
| Raw addresses     | `&raw const foo`               | Unsupported     |                                                                          |
| References        | `&mut foo`                     | Supported       |                                                                          |
| Repeat arrays     | `[4u8; 128]`                   | Supported       |                                                                          |
| Return            | `return false;`                | Unsupported     |                                                                          |
| Struct literals   | `MyStruct { a: 12, b }`        | Supported       |                                                                          |
| Try expression    | `this_call_can_err()?;`        | Unsupported     |                                                                          |
| Tuple literal     | `(a, 4, c)`                    | Supported       |                                                                          |
| Unary expressions | `!x`                           | Partial Support | User-defined unary operations are not supported.                         |
| Unsafe            | `unsafe { ... }`               | Unsupported     |                                                                          |
| While loops       | `while x < 64 { ... }`         | Unsupported     | Cannot be supported as the number of iterations is not known.            |

### Binary expressions

Note: user-defined binary operations are currently unsupported.

| Example    | Supported types                            |
| ---------- | ------------------------------------------ |
| `a + b`    | Integers, floats                           |
| `a - b`    | Integers, floats                           |
| `a * b`    | Integers, floats                           |
| `a / b`    | Integers, floats                           |
| `a % b`    | Integers                                   |
| `a && b`   | Booleans                                   |
| `a \|\| b` | Booleans                                   |
| `a ^ b`    | Booleans                                   |
| `a & b`    | Booleans                                   |
| `a \| b`   | Booleans                                   |
| `a << b`   | None                                       |
| `a >> b`   | Integers, if `b` is known at compile time. |
| `a == b`   | All. Use `derive(PartialEq)` for structs.  |
| `a != b`   | All. Use `derive(PartialEq)` for structs.  |
| `a < b`    | Booleans, integers, floats                 |
| `a <= b`   | Booleans, integers, floats                 |
| `a >= b`   | Booleans, integers, floats                 |
| `a > b`    | Booleans, integers, floats                 |
| `a += b`   | Integers, floats                           |
| `a -= b`   | Integers, floats                           |
| `a *= b`   | Integers, floats                           |
| `a /= b`   | Integers, floats                           |
| `a %= b`   | Integers                                   |
| `a ^= b`   | Booleans                                   |
| `a &= b`   | Booleans                                   |
| `a \|= b`  | Booleans                                   |
| `a <<= b`  | None                                       |
| `a >>= b`  | Integers, if `b` is known at compile time  |

### Cast expressions

`a as MyType` is only supported:

| From Type    | To Type      |
| ------------ | ------------ |
| integer type | integer type |
| `bool`       | integer type |
| integer type | `bool`       |
| `&...&T`     | `&T`         |

### Function calls

The following function calls are supported:

* user-defined function calls (without recursion)
* `ArcisRNG::bool()` to generate a boolean.
* `ArcisRNG::gen_integer_from_width(width: usize) -> u128`. Generates a secret integer between 0 and 2^width - 1 included.
* `ArcisRNG::gen_public_integer_from_width(width: usize) -> u128`. Generates a public integer between 0 and 2^width - 1 included.
* `ArcisRNG::gen_integer_in_range(min: u128, max: u128, n_attempts: usize) -> (result: u128, success: bool)`. See function doc for more information.
* `ArcisRNG::shuffle(slice)` on slices. Complexity is in `O(n*log³(n) + n*log²(n)*sizeof(T))`.
* `Mxe::get()` to be able to create MXE-owned secret data.
* `Shared::new(arcis_public_key)` to share private data with `arcis_public_key`.
* `ArcisPublicKey::from_base58(base58_byte_string)` to create a public key from a base58-encoded address.
* `ArcisPublicKey::from_uint8(u8_byte_slice)` to create a public key from a Uint8 array.

### Literal expressions

| Example     | Support     |
| ----------- | ----------- |
| `"foo"`     | Unsupported |
| `b"foo"`    | Supported   |
| `c"foo"`    | Unsupported |
| `b'f'`      | Supported   |
| `'a'`       | Unsupported |
| `1`         | Supported   |
| `1u16`      | Supported   |
| `1f64`      | Supported   |
| `1.0e10f64` | Supported   |
| `true`      | Supported   |

### Macros

The following macros are supported in order to help you debug your rust code:

* `debug_assert!`, `debug_assert_ne!`, `debug_assert_eq!`. They do not change instruction behavior and are only useful for debugging your rust code.
* `eprint!`, `eprintln!`, `print!`, `println!`. They do not change instruction behavior and are only useful for debugging your rust code.

### Method calls

The following method calls are supported:

* user-defined method calls (without generics and without recursion)
* `.clone()` on all `Clone` objects.
* `.len()`, `.is_empty()`, `.swap(a, b)`, `.fill(value)`, `.reverse()`, `.iter()`, `.iter_mut()`, `.into_iter()`, `.windows(width)` on arrays.
* `.sort()` on arrays of integers. Complexity is in `O(n*log²(n)*bit_size)`.
* `.enumerate()`, `.chain(other)`, `.cloned()`, `.copied()`, `.count()`, `.rev()`, `.zip(other)`, `.map(func)`, `.for_each(func)`, `.fold(init, func)` on iterators.
* `.take(n)`, `.skip(n)`, `.step_by(n)` on iterators when `n` is compile-time known.
* `.reveal()` if not inside a `if` or a `else`
* `.to_arcis()` on `Enc`s
* `.from_arcis(x)` on `Owner`s (objects of types `Mxe` or `Shared`) if not inside a `if` or a `else`
* `.abs()`, `.min(x)`, `.max(x)` on integers and floats
* `.abs_diff(other)`, `.is_positive()`, `.is_negative()` on integers
* `.to_le_bytes()`, `to_be_bytes()` on typed integers (does not work on integers the interpreter does not know the type)
* `.exp()`, `.exp2()`, `.ln()`, `.log2()`, `.sqrt()` on floats.

### Paths

The following paths are supported:

* `IntType::BITS`, `IntType::MIN` and `IntType::MAX` where `IntType` is an integer type.
* Paths to user-defined constants, functions and structs, as long as they don't use the unsupported `crate` or `super`.
* `std::mem::replace` and `std::mem::swap`

## Item support:

| Item Name         | Example                   | Support         | Comments                                                      |
| ----------------- | ------------------------- | --------------- | ------------------------------------------------------------- |
| Constant          | `const MAX: u16 = 65535`  | Supported       |                                                               |
| Enum              | `enum MyEnum { ... }`     | Unsupported     |                                                               |
| Extern            | `extern ...`              | Unsupported     |                                                               |
| Functions         | `fn foo() -> u8 { 0 }`    | Partial Support | Recursive functions are not supported.                        |
| Impls             | `impl MyType { ... }`     | Partial Support | Traits are not supported. `MyType` should not be a reference. |
| Macro Definitions | `macro_rules! ...`        | Unsupported     |                                                               |
| Macro Invocations | `println!(...)`           | Partial Support | [See table above](#macros) for supported macros.              |
| Modules           | `mod my_module { ... }`   | Supported       |                                                               |
| Statics           | `static ...`              | Unsupported     |                                                               |
| Structs           | `struct MyStruct { ... }` | Supported       |                                                               |
| Traits            | `trait MyTrait { ... }`   | Unsupported     |                                                               |
| Type Aliases      | `type MyId = usize;`      | Supported       |                                                               |
| Union             | `union MyUnion { ... }`   | Unsupported     |                                                               |
| Use               | `use arcis_imports::*`    | Partial Support | Only `use arcis_imports::` is supported.                      |

## Pattern support:

The following patterns are supported in function arguments and `let` statements:

* simple idents: `let ident = ...;`
* mutable idents: `let mut ident = ...;`
* ref idents: `let ref ident = ...;`
* mutable ref idents: `let ref mut ident = ...;`
* parentheses around a supported pattern: `let (...) = ...;`
* reference of a supported pattern: `let &... = ...;`
* array of supported patterns: `let [...] = ...;`
* struct of supported patterns: `let MyStruct { ... } = ...;`
* tuple of supported patterns: `let (...) = ...;`
* tuple struct of supported patterns: `let MyStruct(...) = ...;`
* type pattern of a supported pattern: `let ...: ty = ...;`
* wild pattern: `let _ = ...;`

Note: in particular, the `..` pattern is currently unsupported.

#### Performance Considerations

While Arcis provides these operations on encrypted data, it's important to note that operations on encrypted data are more computationally expensive than their plaintext counterparts. Complex calculations can lead to increased computation time and resource usage. It's recommended to optimize your algorithms to minimize the number of operations on encrypted data where possible.

# Types

The following types are supported:

* `u8`, `u16`, `u32`, `u64`, `u128`, `usize`, `i8`, `i16`, `i32`, `i64`, `i128`, `isize`
* `f64`, `f32` (Note: these types are emulated by the fixed-point numbers `k-2^-52`, for `k` between `-2^250` and `2^250`.)
* tuples of supported types, including `()`
* fixed-length arrays of a supported type
* (mutable) references to a supported type
* user-defined structs of supported types
* functions (but not as input or output of an encrypted instruction)
* `ArcisPublicKey`, an Arcis public key wrapper.
* Arcis-defined `Enc`, `Mxe` and `Shared`.

In particular, we do not currently support `HashMap`, `Vec`, `String` (we do not support types with a variable `len`). Constant-size byte strings (like `b"hello_world"`) are supported.

Here, `Enc` type defines the encrypted data input, which is used as `Enc<Owner, T>` where `Owner` can be either `Mxe` or `Shared`, signaling which party the data of type `T` can be decrypted by. You can read more about dealing with encrypted inputs/outputs [here](https://docs.arcium.com/developers/arcis/input-output).

Note: Currently all these types get mapped to secret shares over the curve25519 scalar field under the hood, meaning they all take up the same amount of space. Changing this for better space utilization is on the roadmap and will be implemented soon.

# Input/Output

Inputs and outputs in confidential instructions are handled in the same way. Arcium network does not mutate any state itself. Both inputs and outputs can be encrypted or plaintext data, either being passed by value or by reference. Passing by reference is only possible for account data, where the Arcium nodes will be able fetching data from account. This is beneficial for accounts where data is larger than what can fit in a single Solana transaction, or if you want to avoid storage costs for the data while the computation is in progress (as each input has to be written to a computation object for the duration of the computation).

Encrypted data is passed as an `Enc<Owner, T>` generic type, where `Owner` specifies who can decrypt the data:

* **`Enc<Shared, T>`**: Data encrypted with a shared secret between the client and MXE. Both the client and MXE can decrypt this data. Use this when:
  * Accepting user inputs that the user needs to verify later
  * Returning results the user must be able to decrypt
  * Implementing privacy-preserving user interactions
* **`Enc<Mxe, T>`**: Data encrypted exclusively for the MXE. Only the MXE nodes (acting together) can decrypt this data. Use this when:
  * Storing internal state that users shouldn't access directly
  * Passing data between MXE functions
  * Protecting protocol-level data from individual users

Learn more about [encryption in Arcium Network](https://docs.arcium.com/developers/encryption).

```rust
// Define the data structures we'll work with
struct Order {
    size: u64,
    bid: bool,
    owner: u128,
}

// OrderBook must be a fixed-size structure for MPC
const ORDER_BOOK_SIZE: usize = 100; // Maximum orders supported

struct OrderBook {
    orders: [Order; ORDER_BOOK_SIZE],
}

#[instruction]
pub fn add_order(
    order_ctxt: Enc<Shared, Order>,
    ob_ctxt: Enc<Mxe, &OrderBook>,
) -> Enc<Mxe, OrderBook> {
    let order = order_ctxt.to_arcis();
    let mut ob = *(ob_ctxt.to_arcis());
    let mut found = false;
    for i in 0..ORDER_BOOK_SIZE {
        let overwrite = ob.orders[i].size == 0 && !found;
        if overwrite {
            ob.orders[i] = order;
        }
        found = overwrite || found;
    }
    ob_ctxt.owner.from_arcis(ob)
}
```

Let's use this example to understand how to pass inputs into confidential instructions, compute on them and return outputs. Here, we are trying to add an order to an existing order book.

In this example, `order_ctxt: Enc<Shared, Order>` is passed by value, meaning the entire encrypted order data is submitted onchain. In contrast, `ob_ctxt: Enc<Mxe, &OrderBook>` is passed by reference - only the account's public key is submitted onchain, and the MPC nodes will fetch the actual data from that account during computation. This is particularly useful for large data structures like order books that might not fit in a single transaction.

In order to use the parameters `order_ctxt` and `ob_ctxt` for computation, we need to convert them to corresponding secret shares for the nodes to compute in MPC. This can be done by calling `to_arcis` function on any `Enc` generic parameter. This does not reveal the plaintext data underneath to the nodes during the process.

Here, the order parameter disappears after the confidential instruction has been processed (just as you'd expect in regular rust too). To output the new order book, we convert it back using `from_arcis` on `ob_ctxt.owner` field which defines the owner, aka the party which encrypted the data, to get the new `Enc<Origin, T>` type, and return it.

Currently, as many outputs as can fit in a single transaction are sent in the callback transaction, whereas the rest are all sent to the [callback server](https://docs.arcium.com/developers/callback-server) for state updates. This means that you might need to make state changes through the callback server, and are responsible for updating the on-chain accounts, if needed.

For more details on how to invoke these encrypted instructions from your Solana program, see [Invoking a Computation](https://docs.arcium.com/developers/program).

# Best practices

We provide here a set of miscellaneous tips and tricks and things to keep in mind when writing confidential instructions and programs.

## Execution flow

While we strive to make the Arcis compiler accept inputs that are as close as possible to standard rust code, there are some differences. Fundamentally, this is because code emitted by the Arcis compiler will not depend on the value of private inputs and so must be data independent (Intuitively, this makes sense. If the execution flow of our code depended on the value of a private input, an external observer could use this to learn information about the private values). We highlight here a few examples to keep in mind.

* If/else statements. We would normally not be able to use a masked value in the condition of an if statement. The Arcis compiler will however interpret this correctly and rewrite it into a data independent form. Since this is done by a macro, some syntax valid for the rust compiler will not be accepted (missing else branch, or else if clauses). Additionally, you will not gain any performance from using a masked value in the condition of an if statement: the program will still execute both branches, and just not use the result of the branch that is not taken.
* In general, control flow behavior that depends on a masked value is not supported. This includes early returns, or break statements in for loops, for example. A good rule of thumb is that the execution flow should be the same, no matter what value is masked.
* Currently, variable sized types such as `Vec<T>` are also not supported as length of the data should be known at compile time.

## Operations

Arcium supports multiple MPC backends, but all are based on additive-secret sharing. This has a few implications on what operations are more and less expensive, so we present a few guidelines below. Of course, performance always depends on the exact circuit. These are heuristic and not rules.

* Multiplications between secret values are significantly more expensive than on plaintext, as they involve heavy pre-processing and communication. - Multiplications between a secret and a plaintext value, as well as additions between secret/plaintext values, are basically free and run at pretty much the same speed as on plaintext data.
* Comparisons require conversion from Scalars to arrays of boolean bits which we then compare element-wise. This is a relatively expensive operation. A good rule of thumb is therefore the ordering of performance (where additions is the cheapest operation) is additions -> multiplications -> comparisons.

# Invoking a Computation from your Solana program

Before reading this, we recommend having read the [Computation Lifecycle](https://docs.arcium.com/developers/computation-lifecycle) section, the [Arcis inputs/outputs](https://docs.arcium.com/developers/arcis/input-output) section, and the [Callback Type Generation](https://docs.arcium.com/developers/program/callback-type-generation) guide to understand how output types like `AddTogetherOutput` are automatically generated from encrypted instructions.

## The Basics

Let's say we have the following encrypted instruction and want to invoke it from our MXE.

```rust
#[encrypted]
mod circuits {
    use arcis_imports::*;

    pub struct InputValues {
        v1: u8,
        v2: u8,
    }

    #[instruction]
    pub fn add_together(input_ctxt: Enc<Shared, InputValues>) -> Enc<Shared, u16> {
        let input = input_ctxt.to_arcis();
        let sum = input.v1 as u16 + input.v2 as u16;
        input_ctxt.owner.from_arcis(sum)
    }
}
```

To do this, we first need to receive the encrypted parameter of type `InputValues` which contains two encrypted `u8`s, then encode them into the `Argument` format, and finally queue the computation for execution. Additionally, we need to define a callback instruction that will be invoked when the computation is complete. Callback instructions have a few requirements:

1. They must be defined with the `#[arcium_callback(encrypted_ix = "encrypted_ix_name")]` macro.
2. They must have exactly two arguments: `ctx: Context<...>` and `output: ComputationOutputs<T>` where `T` is named as `{encrypted_ix_name}Output`.

For passing encrypted arguments, if the corresponding argument is `Enc<Shared, T>`, then we need to pass the `Argument::ArcisPubkey(pub_key)` and `Argument::PlaintextU128(nonce)`, before the ciphertext. If the corresponding argument is `Enc<Mxe, T>`, then we only need to pass the nonce as `Argument::PlaintextU128(nonce)` and the ciphertext. Ciphertexts are passed as `Argument::EncryptedXYZ(ciphertext)` where `XYZ` is the type of the ciphertext, with the possibilities being `EncryptedU8`, `EncryptedU16`, `EncryptedU32`, `EncryptedU64`, `EncryptedU128`, `EncryptedBool`.

```rust
pub fn add_together(
    ctx: Context<AddTogether>,
    computation_offset: u64,
    ciphertext_0: [u8; 32],
    ciphertext_1: [u8; 32],
    pub_key: [u8; 32],
    nonce: u128,
) -> Result<()> {
    // Build the args the confidential instruction expects (ArcisPubkey, nonce, EncryptedU8, EncryptedU8)
    let args = vec![
        Argument::ArcisPubkey(pub_key),
        Argument::PlaintextU128(nonce),
        Argument::EncryptedU8(ciphertext_0),
        Argument::EncryptedU8(ciphertext_1),
    ];

    // Set the bump for the sign_pda_account
    ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;

    // Build & queue our computation (via CPI to the Arcium program)
    queue_computation(
        ctx.accounts,
        // Random offset for the computation
        computation_offset,
        // The one-time inputs our confidential instruction expects
        args,
        // Callback server address
        // None here because the output of the confidential instruction can fit into a solana transaction
        // as its just 1 ciphertext which is 32 bytes
        None,
        // Use callback_ix() helper to generate the callback instruction
        vec![AddTogetherCallback::callback_ix(&[])],  // Empty array = no custom accounts
    )?;
    Ok(())
}

// Macro provided by the Arcium SDK to define a callback instruction.
#[arcium_callback(encrypted_ix = "add_together")]
pub fn add_together_callback(
    ctx: Context<AddTogetherCallback>,
    output: ComputationOutputs<AddTogetherOutput>,
) -> Result<()> {
    let o = match output {
        ComputationOutputs::Success(AddTogetherOutput { field_0 }) => field_0,
        _ => return Err(ErrorCode::AbortedComputation.into()),
    };

    emit!(SumEvent {
        sum: o.ciphertexts[0],
        nonce: o.nonce.to_le_bytes(),
    });

    Ok(())
}

```

Let's also have a look at the `Accounts` structs for each of these instructions:

```rust
/// Accounts required to invoke the `add_together` encrypted instruction.
/// `add_together` must be the name of the encrypted instruction we're invoking.

#[queue_computation_accounts("add_together", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct AddTogether<'info> {
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
    pub mxe_account: Account<'info, MXEAccount>,
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
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_ADD_TOGETHER)
    )]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,
    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account)
    )]
    pub cluster_account: Account<'info, Cluster>,
    #[account(
        mut,
        address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS,
    )]
    pub pool_account: Account<'info, FeePool>,
    #[account(
        address = ARCIUM_CLOCK_ACCOUNT_ADDRESS
    )]
    pub clock_account: Account<'info, ClockAccount>,
    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}
```

That's a lot of accounts to remember! Here's what each one does:

**Core MXE Accounts:**

* `mxe_account`: Your MXE's metadata and configuration
* `mempool_account`: Queue where computations wait to be processed
* `executing_pool`: Tracks computations currently being executed
* `computation_account`: Stores individual computation data and results
* `comp_def_account`: Definition of your encrypted instruction (circuit)

**Arcium Network Accounts:**

* `cluster_account`: The MPC cluster that will process your computation
* `pool_account`: Arcium's fee collection account
* `clock_account`: Network timing information

**System Accounts:**

* `payer`: Pays transaction fees and rent
* `sign_pda_account`: PDA signer for the computation
* `system_program`: Solana's system program for account creation
* `arcium_program`: Arcium's core program that orchestrates MPC

The good news is these can be copy-pasted for any confidential instruction. You only need to change:

1. `COMP_DEF_OFFSET_ADD_TOGETHER` to match your instruction name
2. The instruction name in the `queue_computation_accounts` macro

How about the accounts for the callback instruction?

```rust
#[callback_accounts("add_together")]
#[derive(Accounts)]
pub struct AddTogetherCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    /// Like above, COMP_DEF_PDA_SEED is a constant defined in the Arcium SDK.
    /// COMP_DEF_OFFSET_ADD_TOGETHER is an encrypted instruction specific u32
    /// offset which can be calculated with `comp_def_offset("add_together")`, where
    /// comp_def_offset is a function provided by the Arcium SDK and `add_together`
    /// is the name of the encrypted instruction we're invoking.
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_ADD_TOGETHER)
    )]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by the account constraint
    pub instructions_sysvar: AccountInfo<'info>,
}
```

Here it's a lot fewer accounts fortunately! Like with the `AddTogether` struct, we need to change the parameter for the `derive_comp_def_pda` macro and in the `callback_accounts` macro depending on the encrypted instruction we're invoking.

The `callback_ix()` method is a convenient helper generated by the `#[callback_accounts]` macro that automatically creates the proper callback instruction with all required accounts.

But what if we don't just want to return a raw value and need some additional accounts? Check out [input/outputs](https://docs.arcium.com/developers/arcis/input-output) for how to handle encrypted data and [callback accounts](https://docs.arcium.com/developers/program/callback-accs) for returning additional accounts in the callback.

# Computation Definition Accounts

## Why Computation Definitions Exist

When you write an encrypted instruction using Arcis, it gets compiled into an MPC circuit - essentially a program that the MPC nodes can execute securely on encrypted data. But here's the challenge: how do the MPC nodes know what circuit to run when your Solana program calls for a computation?

That's where Computation Definition Accounts come in. They serve as the bridge between your Solana program and the MPC network, storing both the circuit itself and metadata about how to execute it. Think of it as uploading your encrypted instruction to the blockchain so the MPC nodes can access it when needed.

## Computation Definition Accounts

When we define an encrypted instruction using [Arcis](https://docs.arcium.com/developers/arcis), we need the MPC cluster that will execute this confidential instruction to have access to the confidential instruction itself, its interface, and some more metadata. This is done by defining a `ComputationDefinitionAccount` struct, which consists of two parts:

1. The confidential instruction metadata and interface.
2. The raw MPC bytecode.

The interface provides data around what input and output types are expected, what accounts are required, and a few other pieces of metadata. It's data is stored in an account with the seeds`b"ComputationDefinitionAccount", mxe_program_id, comp_def_offset`. The first is exported as a constant by the Arcium Anchor SDK, the second is just the program id of our MXE program, and the third is a confidential-instruction-specific offset. It is computed with `comp_def_offset = sha256(<confidential_instruction_name>).slice(0,4)` and then interpreted as a little-endian u32. Theoretically, you shouldn't need to know this, but it's good to know what's going on under the hood. We abstract this with `derive_comp_def_pda` macro which takes in the `comp_def_offset` as a parameter, and computes the `ComputationDefinitionAccount` address for you.

The MPC bytecode is stored inside account(s) with the seeds `b"ComputationDefinitionRaw", comp_def_acc, i`. Like above, the first is exported as a constant by the Arcium Anchor SDK, the second is the computation definition account we defined above, and the third is an index starting from 0 up to however many accounts we need to store the full MPC bytecode.

## Usage

When working locally, you theoretically don't need to care about the MPC bytecode accounts, as the Arcium CLI will handle the creation and management of these accounts for you. You do however need to create the interface ComputationDefinitionAccount, which can easily be done with the Arcium Anchor tooling. Let's say we want to deploy a confidential instruction called `add_together`:

```rust
pub fn init_add_together_comp_def(ctx: Context<InitAddTogetherCompDef>) -> Result<()> {
    init_comp_def(ctx.accounts, true, 0, None, None)?;
    Ok(())
}

#[init_computation_definition_accounts("add_together", payer)]
#[derive(Accounts)]
pub struct InitAddTogetherCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut)]
    // The computation definition account that will be created. We can't
    // specify the seeds and account type directly here, as it gets
    // initialized via CPI so these constraints would fail in our non-CPI
    // instruction. This is ok, as the Arcium program will create the
    // account with the correct seeds and account type for us.
    pub comp_def_account: UncheckedAccount<'info>,
    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}
```

And that's all, we just have to make sure to call this instruction once at the beginning before we can use the confidential instruction.

# Callback Accounts

Callback accounts provide a way to define additional accounts to be used in the callback instruction for a computation. This is helpful when you want to use the output of a computation to modify an onchain account.

**Prerequisites**: Before diving into callback accounts, make sure you've read:

* [Basic program invocation guide](https://docs.arcium.com/developers/program) - fundamentals of queuing computations and defining callback instructions
* [Callback Type Generation](https://docs.arcium.com/developers/program/callback-type-generation) - how output types like `AddTogetherOutput` are automatically generated from encrypted instructions
* [Arcis inputs/outputs](https://docs.arcium.com/developers/arcis/input-output) - handling encrypted data types

**When to use callback accounts:**

* Storing computation results in persistent accounts
* Updating game state, user balances, or protocol data
* Writing results that exceed transaction size limits

## Complete Example

Expanding on our [basic example](https://docs.arcium.com/developers/program), let's say we want to save the result of our addition in an account for later use. We'll walk through the complete implementation step by step.

### Step 1: Define the Account Structure

First, define an account to store our computation result:

```rust
#[account]
#[derive(InitSpace)]
pub struct SecretAdditionResult {
    pub sum: [u8; 32], // Store the encrypted result as ciphertext
}

pub fn init(ctx: Context<Initialize>) -> Result<()> {
    Ok(())
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        init,
        payer = signer,
        seeds = [b"AdditionResult"],
        space = 8 + SecretAdditionResult::INIT_SPACE,
        // Note: In a real implementation you should usually save the bump too,
        // but for the sake of simplicity in this example we skip that
        bump
    )]
    pub add_result_account: Account<'info, SecretAdditionResult>,
    pub system_program: Program<'info, System>,
}
```

### Step 2: Modify the Queue Function

There are two ways to specify callback instructions in your `queue_computation` call:

#### Recommended: Using callback\_ix() Helper

The `callback_ix()` helper method is the **preferred approach** because it automatically handles the 3 required standard accounts and is less error-prone.

**What callback\_ix() does automatically:**

* Creates a CallbackInstruction with the proper instruction data
* Automatically includes 3 standard accounts: `arcium_program`, `comp_def_account`, `instructions_sysvar`
* Accepts custom accounts through the `&[CallbackAccount]` parameter
* Eliminates boilerplate and prevents errors

```rust
pub fn add_together(
    ctx: Context<AddTogether>,
    computation_offset: u64,
    ciphertext_0: [u8; 32],
    ciphertext_1: [u8; 32],
    pub_key: [u8; 32],
    nonce: u128,
) -> Result<()> {
    // Note: Using `create_program_address` with the bump would be more efficient than `find_program_address`.
    // Since this PDA is constant, you could also derive it at compile time and save it as a constant.
    // We use find_program_address here for simplicity.
    let addition_result_pda = Pubkey::find_program_address(&[b"AdditionResult"], ctx.program_id).0;

    // Build the args the confidential instruction expects (ArcisPubkey, nonce, EncryptedU8, EncryptedU8)
    let args = vec![
        Argument::ArcisPubkey(pub_key),
        Argument::PlaintextU128(nonce),
        Argument::EncryptedU8(ciphertext_0),
        Argument::EncryptedU8(ciphertext_1),
    ];

    // Set the bump for the sign_pda_account
    ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;

    // Build & queue our computation (via CPI to the Arcium program)
    queue_computation(
        ctx.accounts,
        // Random offset for the computation
        computation_offset,
        // The one-time inputs our confidential instruction expects
        args,
        // Callback server address
        // None here because the output of the confidential instruction can fit into a solana transaction
        // as its just 1 Ciphertext which is 32 bytes
        None,
        // Using callback_ix() helper - automatically includes the 3 standard accounts
        // (arcium_program, comp_def_account, instructions_sysvar) plus our custom account
        vec![AddTogetherCallback::callback_ix(&[
            CallbackAccount {
                pubkey: addition_result_pda,
                is_writable: true, // Tells nodes to mark this account as writable in the transaction
            }
        ])],
    )?;
    Ok(())
}

/* The AddTogether accounts struct stays exactly the same as shown in the basic guide */
```

#### Understanding What Happens: Manual CallbackInstruction

For educational purposes, here's what `callback_ix()` generates under the hood. This manual approach is functionally equivalent but more verbose and error-prone:

```rust
pub fn add_together(
    ctx: Context<AddTogether>,
    computation_offset: u64,
    ciphertext_0: [u8; 32],
    ciphertext_1: [u8; 32],
    pub_key: [u8; 32],
    nonce: u128,
) -> Result<()> {
    // Note: Using `create_program_address` with the bump would be more efficient than `find_program_address`.
    // Since this PDA is constant, you could also derive it at compile time and save it as a constant.
    // We use find_program_address here for simplicity.
    let addition_result_pda = Pubkey::find_program_address(&[b"AdditionResult"], ctx.program_id).0;

    // Build the args the confidential instruction expects (ArcisPubkey, nonce, EncryptedU8, EncryptedU8)
    let args = vec![
        Argument::ArcisPubkey(pub_key),
        Argument::PlaintextU128(nonce),
        Argument::EncryptedU8(ciphertext_0),
        Argument::EncryptedU8(ciphertext_1),
    ];

    // Set the bump for the sign_pda_account
    ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;

    // Build & queue our computation (via CPI to the Arcium program)
    queue_computation(
        ctx.accounts,
        // Random offset for the computation
        computation_offset,
        // The one-time inputs our confidential instruction expects
        args,
        // Callback server address
        // None here because the output of the confidential instruction can fit into a solana transaction
        // as its just 1 ciphertext which is 32 bytes
        None,
        // Manual approach: Define which callback instruction to call when the computation is complete.
        // We specify the program ID, instruction discriminator, and all accounts needed
        // for the callback, including our result account which we want to be writable.
        vec![CallbackInstruction {
            program_id: ID_CONST,
            discriminator: instruction::AddTogetherCallback::DISCRIMINATOR.to_vec(),
            accounts: vec![
                // Standard accounts (always required, in this order)
                CallbackAccount {
                    pubkey: ARCIUM_PROGRAM_ID,
                    is_writable: false,
                },
                CallbackAccount {
                    pubkey: derive_comp_def_pda!(COMP_DEF_OFFSET_ADD_TOGETHER),
                    is_writable: false,
                },
                CallbackAccount {
                    pubkey: INSTRUCTIONS_SYSVAR_ID,
                    is_writable: false,
                },
                // Custom accounts (your callback-specific accounts)
                CallbackAccount {
                    pubkey: addition_result_pda,
                    is_writable: true, // Tells nodes to mark this account as writable in the transaction
                }
            ]
        }],
    )?;
    Ok(())
}

/* The AddTogether accounts struct stays exactly the same as shown in the basic guide */
```

**Key Point**: Both approaches are functionally equivalent. The `callback_ix()` method automatically generates the exact same `CallbackInstruction` structure as the manual approach, but with less code and reduced chance for errors.

**Important**: We added the account to the callback (either via `callback_ix()` parameter or `CallbackInstruction.accounts`) but didn't include it in the AddTogether accounts struct because we don't read or write to it during the queue function - only during the callback.

### Step 3: Implement the Callback Function

The callback instruction receives the accounts in the exact order specified in the queue function:

```rust
// Macro provided by the Arcium SDK to define a callback instruction.
#[arcium_callback(encrypted_ix = "add_together")]
pub fn add_together_callback(
    ctx: Context<AddTogetherCallback>,
    output: ComputationOutputs<AddTogetherOutput>,
) -> Result<()> {
    let o = match output {
        ComputationOutputs::Success(AddTogetherOutput { field_0 }) => field_0,
        _ => return Err(ErrorCode::AbortedComputation.into()),
    };

    emit!(SumEvent {
        sum: o.ciphertexts[0],
        nonce: o.nonce.to_le_bytes(),
    });

    // Save the result in our callback account too
    ctx.accounts.add_result_account.sum = o.ciphertexts[0];

    Ok(())
}


#[callback_accounts("add_together")]
#[derive(Accounts)]
pub struct AddTogetherCallback<'info> {
    // Standard accounts (match the first 3 in CallbackInstruction.accounts)
    pub arcium_program: Program<'info, Arcium>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_ADD_TOGETHER)
    )]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,
    /// CHECK: instructions_sysvar, checked by the account constraint
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    pub instructions_sysvar: AccountInfo<'info>,

    // Custom accounts (match remaining accounts in CallbackInstruction.accounts)
    #[account(
        mut,
        seeds = [b"AdditionResult"],
        // Note: In a real implementation you should usually save the bump too,
        // but for the sake of simplicity in this example we skip that
        bump
    )]
    pub add_result_account: Account<'info, SecretAdditionResult>,
}
```

## Key Requirements & Constraints

### Account Ordering

The accounts in your callback struct **must match exactly** the order in `CallbackInstruction.accounts`:

1. First three accounts are always standard (arcium\_program, comp\_def\_account, instructions\_sysvar)
2. Custom accounts follow in the exact sequence you specified

### Account Creation Rules

* **Can create** accounts in the queue computation function (user pays rent)
* **Cannot create** accounts during callback execution (would require nodes to pay)
* Accounts must exist before the callback executes
* Account size cannot change during callback

### Writability Requirements

* Set `is_writable: true` in CallbackAccount to tell nodes to mark the account as writable
* The account must have `#[account(mut)]` in the callback struct
* Without proper writability flags, mutations will fail

## Troubleshooting

**Account not found**: Ensure the account exists before callback execution. Initialize it in the queue function or a separate instruction.

**Order mismatch errors**: Double-check that your callback struct accounts are in the exact same order as the CallbackInstruction.accounts vector.

**Cannot modify account**: Verify both `is_writable: true` in CallbackAccount and `#[account(mut)]` in the callback struct are set.

**Size errors**: Callback accounts cannot be resized. Allocate sufficient space when creating the account.

## Understanding callback\_ix() in Detail

The `callback_ix()` method you see throughout these examples is a convenient helper that's automatically generated by the `#[callback_accounts]` macro.

### How callback\_ix() Works

When you define a callback struct with `#[callback_accounts("instruction_name")]`, the macro automatically generates a `callback_ix()` method that:

1. **Creates a CallbackInstruction** with the proper instruction data
2. **Automatically includes 3 standard accounts** that every callback needs:
   * `arcium_program`: The Arcium program that will invoke your callback
   * `comp_def_account`: The computation definition account for your encrypted instruction
   * `instructions_sysvar`: Solana's instructions sysvar for transaction validation
3. **Accepts custom accounts** through the `&[CallbackAccount]` parameter

### Usage Patterns

**Basic usage (no custom accounts):**

```rust
vec![AddTogetherCallback::callback_ix(&[])]
```

The empty array indicates no custom accounts needed beyond the 3 standard ones.

**Advanced usage (with custom accounts):**

```rust
vec![AddTogetherCallback::callback_ix(&[
    CallbackAccount {
        pubkey: my_account.key(),
        is_writable: true,
    },
    // ... more custom accounts
])]
```

### Why Use callback\_ix()?

The `callback_ix()` helper is the **recommended approach** because it:

* **Eliminates boilerplate**: No need to manually construct CallbackInstruction
* **Prevents errors**: Automatically includes all required standard accounts
* **Maintains consistency**: Ensures your callback instructions follow the correct format
* **Simplifies maintenance**: Changes to callback requirements are handled by the macro

## Going Further

This guide covered the advanced patterns for working with callback accounts. To understand the fundamentals of callback instructions, see our [basic program invocation guide](https://docs.arcium.com/developers/program).

For handling different types of encrypted data inputs and outputs, see [Arcis inputs/outputs](https://docs.arcium.com/developers/arcis/input-output).

# Callback Type Generation

## What This Solves

When you write encrypted instructions in Arcium, the results come back as structured data. Previously, developers had to manually parse raw bytes - tracking offsets, sizes, and converting back to the right types. This was error-prone and tedious.

Arcium's type generation system analyzes your circuit's return type and automatically creates typed Rust structs. This means you can work directly with structured data instead of byte arrays.

## Mental Model: From Functions to Structs

Here's the transformation that happens automatically:

```rust
// You write this encrypted instruction:
#[instruction]
pub fn add_numbers() -> Enc<Shared, u64> { /* ... */ }

// Arcium generates this for your callback:
pub struct AddNumbersOutput {
    pub field_0: SharedEncryptedStruct<1>, // 1 = single u64 value
}
```

The generated struct gives you typed access to encrypted results, with predictable naming and field patterns you can rely on.

## What You'll Learn

After reading this guide, you'll know how to:

* Work with automatically generated Rust structs for encrypted computation outputs
* Predict what struct names and fields Arcium will create
* Handle different encryption types (Shared vs MXE) in callbacks
* Debug type generation issues when they arise

## 30-Second Quick Start

1. Write your circuit:

   ```rust
   #[instruction]
   pub fn my_calc() -> Enc<Shared, u64> { /* ... */ }
   ```
2. Generate types: `arcium build`
3. Use in callback:

   ```rust
   #[arcium_callback(encrypted_ix = "my_calc")]
   pub fn callback(output: ComputationOutputs<MyCalcOutput>) -> Result<()> {
       let result = match output {
           ComputationOutputs::Success(data) => data,
           _ => return Err(ErrorCode::AbortedComputation.into()),
       };
       let encrypted_value = result.field_0.ciphertexts[0];
       // Your logic here
       Ok(())
   }
   ```

## Your First Generated Type: Simple Addition

Here's a concrete example. Consider this encrypted instruction that adds two numbers:

```rust
#[encrypted]
mod circuits {
    use arcis_imports::*;

    #[instruction]
    pub fn add_together(input: Enc<Shared, (u8, u8)>) -> Enc<Shared, u16> {
        let (a, b) = input.to_arcis();
        let sum = a as u16 + b as u16;
        input.owner.from_arcis(sum)
    }
}
```

When Arcium sees that your function returns `Enc<Shared, u16>`, it automatically generates this output struct:

```rust
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct AddTogetherOutput {
    pub field_0: SharedEncryptedStruct<1>,
}
```

Notice the pattern:

* **Name**: `add_together` becomes `AddTogetherOutput`
* **Field**: Always `field_0` for single return values
* **Type**: `SharedEncryptedStruct<1>` because it's shared-encrypted with 1 value (the u16)

Now you can use this in your callback with full type safety:

```rust
#[arcium_callback(encrypted_ix = "add_together")]
pub fn add_together_callback(
    ctx: Context<AddTogetherCallback>,
    output: ComputationOutputs<AddTogetherOutput>,
) -> Result<()> {
    let result = match output {
        ComputationOutputs::Success(AddTogetherOutput { field_0 }) => field_0,
        _ => return Err(ErrorCode::AbortedComputation.into()),
    };

    // Access the encrypted result and metadata
    emit!(SumEvent {
        sum: result.ciphertexts[0],      // The encrypted u16 sum
        nonce: result.nonce.to_le_bytes(), // Nonce for decryption
    });
    Ok(())
}
```

## How Type Generation Works

Working with encrypted computation results used to require manual byte parsing - tracking offsets, sizes, and types yourself. Arcium generates typed structs automatically, so you can focus on application logic instead of low-level data handling.

### The Macro Magic

Here's the key insight: when you write an encrypted instruction with the `#[instruction]` macro, something important happens behind the scenes. The macro doesn't just process your function - it also generates corresponding Rust structs based on your return type.

```rust
#[instruction]
pub fn add_together(input: Enc<Shared, (u8, u8)>) -> Enc<Shared, u16> {
    // Your function code here
}
```

During macro expansion, Arcium analyzes that `Enc<Shared, u16>` return type and automatically generates:

```rust
// This struct is generated for you - you never write it yourself!
pub struct AddTogetherOutput {
    pub field_0: SharedEncryptedStruct<1>,
}
```

This is why you can reference `AddTogetherOutput` in your callback even though you never explicitly defined it. The macro created it for you during compilation, and it's automatically available in your program's scope.

### Immediate Availability

These generated types become available as soon as the macro runs - which happens during normal Rust compilation. You don't need to wait for a separate build step to start using them in your callback functions.

```rust
// This works immediately after defining your #[instruction] above
#[arcium_callback(encrypted_ix = "add_together")]
pub fn callback(output: ComputationOutputs<AddTogetherOutput>) -> Result<()> {
    // AddTogetherOutput is available here automatically
}
```

## Behind the Scenes: What the Macro Actually Does

Understanding how the `#[instruction]` macro generates types helps explain why the system works the way it does.

### Macro Expansion Process

When Rust processes your `#[instruction]` macro, here's what happens:

1. **Parse the return type**: The macro examines your function signature and extracts the return type
2. **Analyze the structure**: It breaks down complex types (tuples, structs, encryption wrappers) into components
3. **Generate struct definitions**: It creates typed structs that match your return type's structure
4. **Inject into scope**: The generated types become available in your program module automatically

### What Gets Generated

For different return types, the macro generates different struct patterns:

```rust
// Your function:
#[instruction]
pub fn simple() -> Enc<Shared, u32>

// Macro generates:
pub struct SimpleOutput {
    pub field_0: SharedEncryptedStruct<1>,
}
```

```rust
// Your function:
#[instruction]
pub fn complex() -> (Enc<Shared, u32>, Enc<Mxe, bool>)

// Macro generates:
pub struct ComplexOutput {
    pub field_0: ComplexOutputStruct0,
}
pub struct ComplexOutputStruct0 {
    pub field_0: SharedEncryptedStruct<1>,
    pub field_1: MXEEncryptedStruct<1>,
}
```

### Why This Approach Works

This macro-driven approach provides several benefits:

* **Type safety**: You get compile-time type checking for encrypted results
* **No manual definition**: You don't need to define output structs yourself
* **Consistency**: All generated types follow the same predictable patterns
* **Automatic updates**: If you change your function's return type, the structs update automatically

The key insight is that these structs exist in your compiled program but not in your source code - they're created during the build process and become available for you to use.

## Understanding LEN Parameters

In our `add_together` example, you saw `SharedEncryptedStruct<1>`. The `<LEN>` number tells you how many encrypted scalar values are stored inside.

The `<LEN>` number represents the count of individual encrypted scalar values:

| Return Type                | LEN Value   | Why                               |
| -------------------------- | ----------- | --------------------------------- |
| `Enc<Shared, u32>`         | 1           | Single scalar                     |
| `Enc<Shared, (u32, bool)>` | 2           | Two scalars                       |
| `Enc<Shared, [u32; 5]>`    | 5           | Five array elements               |
| `Enc<Shared, MyStruct>`    | field count | Count all scalar fields in struct |

**For custom structs**, LEN equals total scalar fields:

```rust
struct UserProfile {
    id: u32,        // 1 scalar
    balance: u64,   // 1 scalar
    active: bool,   // 1 scalar
}
// Result: SharedEncryptedStruct<3>
```

## Type Availability and Scope

### Where Generated Types Live

Generated types are automatically scoped to your program module and become available immediately after the `#[instruction]` macro runs. This means:

```rust
// In your lib.rs or program module
#[instruction]
pub fn calculate() -> Enc<Shared, u64> { /* ... */ }

// CalculateOutput is now available in this same module scope
#[arcium_callback(encrypted_ix = "calculate")]
pub fn callback(output: ComputationOutputs<CalculateOutput>) -> Result<()> {
    // You can reference CalculateOutput here
}
```

### No Import Required

Unlike external types, you don't need to import generated types. They're injected directly into your module's namespace during macro expansion:

```rust
// No need for: use some_crate::CalculateOutput;
// The type just exists automatically
```

### Generated Struct Properties

All generated structs automatically receive standard derives that make them work with Anchor:

```rust
// Every generated struct gets these automatically:
#[derive(AnchorSerialize, AnchorDeserialize, Debug, Clone)]
pub struct YourFunctionOutput {
    // fields...
}
```

This is why you can use generated types in Anchor contexts without additional setup.

### Multiple Instructions, Multiple Types

Each `#[instruction]` creates its own set of output types:

```rust
#[instruction] pub fn add() -> Enc<Shared, u32>      // → AddOutput
#[instruction] pub fn multiply() -> Enc<Shared, u32> // → MultiplyOutput
#[instruction] pub fn divide() -> Enc<Shared, u32>   // → DivideOutput
```

All generated types coexist in the same module scope without conflicts.

## Generation Process

When you define an encrypted instruction:

1. Arcium reads your circuit's output types
2. It generates corresponding Rust structs with predictable names
3. It automatically detects encryption patterns and creates specialized types
4. Everything gets integrated into your `#[arcium_callback]` functions

## How the Naming Works

The naming follows predictable patterns:

### Your Circuit Gets an Output Struct

If your encrypted instruction is called `add_together`, you get a struct called `AddTogetherOutput`. Arcium converts your circuit name to PascalCase and adds "Output" at the end.

### Fields Are Numbered

Since Anchor doesn't support tuple structs (yet), Arcium uses numbered fields instead. So if your function returns multiple values, you'll get `field_0`, `field_1`, `field_2`, and so on. Not the prettiest names, but they're consistent and predictable.

### Complex Types Get Their Own Structs

When your function returns complex nested data (like tuples or custom structs), Arcium generates additional helper structs with a unified naming convention:

* All output structs use `{CircuitName}OutputStruct{index}` pattern
* Nested structs within outputs use `{ParentName}OutputStruct{parent_index}{field_index}` pattern
* The naming ensures uniqueness while maintaining consistency

## Encryption Types: Shared vs MXE

Arcium automatically detects different encryption patterns and generates the right struct type. Understanding when each type is used helps you predict the generated structs.

### SharedEncryptedStruct\<N>

When your circuit returns `Enc<Shared, T>`, Arcium knows this is data that both the client and the MXE can decrypt. It generates a struct that includes everything needed for decryption:

```rust
pub struct SharedEncryptedStruct<const LEN: usize> {
    pub encryption_key: [u8; 32],    // The shared public key
    pub nonce: u128,                 // Random nonce for security
    pub ciphertexts: [[u8; 32]; LEN], // Your actual encrypted data
}
```

The `<N>` part tells you how many encrypted values are packed inside. So `SharedEncryptedStruct<1>` has one encrypted value, `SharedEncryptedStruct<3>` has three, and so on.

In your callback, you can access everything you need:

```rust
let shared_key = result.encryption_key;  // For key exchange
let nonce = result.nonce;               // For decryption
let encrypted_value = result.ciphertexts[0]; // Your data
```

### MXEEncryptedStruct\<N>

For `Enc<Mxe, T>` data, only the MXE cluster can decrypt it - clients can't. Since there's no shared secret needed, the struct is simpler:

```rust
pub struct MXEEncryptedStruct<const LEN: usize> {
    pub nonce: u128,                 // Still need the nonce
    pub ciphertexts: [[u8; 32]; LEN], // Your encrypted data
}
```

Notice there's no `encryption_key` field here - that's because clients don't get to decrypt MXE data.

```rust
// Working with MXE-encrypted data
let nonce = result.nonce;
let encrypted_value = result.ciphertexts[0];
// Note: You can't decrypt this on the client side!
```

### EncDataStruct\<N>

For simple encrypted data without key exchange metadata (less commonly used):

```rust
// Pattern: Only N Ciphertexts
pub struct EncDataStruct<const LEN: usize> {
    pub ciphertexts: [[u8; 32]; LEN], // Raw encrypted values
}
```

**Note**: `EncDataStruct<N>` is used in special cases where only ciphertext data is needed without additional metadata. Most applications use `SharedEncryptedStruct<N>` or `MXEEncryptedStruct<N>` instead.

## Moving to Real-World Applications

Now that you understand the basics with our simple addition example, here's how this works in real applications. The key difference is that real apps often:

* **Return multiple values**: Functions return tuples or complex structs instead of single values
* **Mix encryption types**: Some data for users (`Shared`), some for MXE only (`Mxe`)
* **Handle complex data**: Custom structs with multiple fields instead of simple numbers

The type generation system handles all of this automatically - you just need to understand the patterns.

## Real-World Examples

Here's how this type generation works in actual Arcium applications:

### Simple Tuple Example

Let's start with something in between - a function that returns two related values:

```rust
#[instruction]
pub fn calculate_stats(value: u32) -> (Enc<Shared, u32>, Enc<Shared, u32>) {
    // Calculate both the square and double of a number
    (value.square(), value * 2)
}
```

Since this returns a tuple `(Enc<Shared, u32>, Enc<Shared, u32>)`, Arcium generates:

```rust
pub struct CalculateStatsOutput {
    pub field_0: CalculateStatsOutputStruct0,  // The whole tuple becomes one field
}

pub struct CalculateStatsOutputStruct0 {
    pub field_0: SharedEncryptedStruct<1>,     // First u32 (the square)
    pub field_1: SharedEncryptedStruct<1>,     // Second u32 (the double)
}
```

Notice how tuples get wrapped: the tuple itself becomes `field_0`, and its elements become `field_0`, `field_1`, etc.

### Voting Application

Now let's look at a more realistic example. The [confidential voting example](https://github.com/arcium-hq/examples/tree/main/voting) shows a perfect use case. You have poll data that only the MXE should see, and a user's vote that should be shared between the user and the MXE:

```rust
// Example poll data structure (would be defined in your program)
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct PollData {
    pub vote_count_yes: u32,
    pub vote_count_no: u32,
    pub is_active: bool,
}

#[instruction]
pub fn vote(
    poll_data: Enc<Mxe, &PollData>,     // Poll results stay private
    vote_choice: Enc<Shared, u8>        // User can verify their vote
) -> (Enc<Mxe, PollData>, Enc<Shared, bool>) {
    // ... voting logic that maintains privacy
}
```

Since this function returns a tuple `(Enc<Mxe, PollData>, Enc<Shared, bool>)`, Arcium generates:

```rust
pub struct VoteOutput {
    pub field_0: VoteOutputStruct0,  // The whole tuple wraps into one field
}

pub struct VoteOutputStruct0 {
    pub field_0: MXEEncryptedStruct<3>,    // The updated poll data (vote_count_yes + vote_count_no + is_active = 3)
    pub field_1: SharedEncryptedStruct<1>, // The vote confirmation (boolean)
}
```

Now in your callback, you can work with properly typed data instead of raw bytes:

```rust
#[arcium_callback(encrypted_ix = "vote")]
pub fn vote_callback(
    ctx: Context<VoteCallback>,
    output: ComputationOutputs<VoteOutput>,
) -> Result<()> {
    let VoteOutput { field_0 } = match output {
        ComputationOutputs::Success(result) => result,
        _ => return Err(ErrorCode::AbortedComputation.into()),
    };

    let poll_data = field_0.field_0;         // The updated poll (MXE only)
    let vote_confirmation = field_0.field_1; // User's confirmation (shared)

    // Emit an event with the user's confirmation
    emit!(VoteEvent {
        confirmation: vote_confirmation.ciphertexts[0],
        nonce: vote_confirmation.nonce.to_le_bytes(),
    });
    Ok(())
}
```

### Coinflip Application: Back to Basics

After seeing complex tuples and mixed encryption types, let's look at the simplest possible case. The [coinflip example](https://github.com/arcium-hq/examples/tree/main/coinflip) returns just a single encrypted boolean:

```rust
#[instruction]
pub fn flip() -> Enc<Shared, bool> {
    // Generate secure randomness in MPC
    // Return encrypted result that client can decrypt
}
```

Arcium sees this returns `Enc<Shared, bool>` and creates:

```rust
pub struct FlipOutput {
    pub field_0: SharedEncryptedStruct<1>, // Just one boolean
}
```

Your callback:

```rust
#[arcium_callback(encrypted_ix = "flip")]
pub fn flip_callback(
    ctx: Context<FlipCallback>,
    output: ComputationOutputs<FlipOutput>,
) -> Result<()> {
    let result = match output {
        ComputationOutputs::Success(FlipOutput { field_0 }) => field_0,
        _ => return Err(ErrorCode::AbortedComputation.into()),
    };

    // Emit the encrypted result - client will decrypt to see heads/tails
    emit!(FlipEvent {
        result: result.ciphertexts[0],
        nonce: result.nonce.to_le_bytes(),
    });
    Ok(())
}
```

### Blackjack Application

From the [blackjack example](https://github.com/arcium-hq/examples/tree/main/blackjack) with complex game state:

```rust
// Example structures (would be defined in your blackjack program)
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct GameState {
    pub deck_cards: [u8; 52],
    pub dealer_cards: [u8; 10],
    pub round_number: u32,
    pub game_active: bool,
    pub house_balance: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct PlayerHand {
    pub cards: [u8; 10],
    pub card_count: u8,
    pub bet_amount: u64,
}

#[instruction]
pub fn player_hit(
    game_state: Enc<Mxe, &GameState>,
    player_hand: Enc<Shared, PlayerHand>
) -> (Enc<Mxe, GameState>, Enc<Shared, PlayerHand>, Enc<Shared, bool>) {
    // ... game logic
}
```

**Generated types**:

```rust
pub struct PlayerHitOutput {
    pub field_0: PlayerHitOutputStruct0,
}

pub struct PlayerHitOutputStruct0 {
    pub field_0: MXEEncryptedStruct<65>,   // Updated game state (deck_cards[52] + dealer_cards[10] + round_number[1] + game_active[1] + house_balance[1] = 65)
    pub field_1: SharedEncryptedStruct<12>, // Player's new hand (cards[10] + card_count[1] + bet_amount[1] = 12)
    pub field_2: SharedEncryptedStruct<1>, // Is game over? (boolean)
}
```

## Complex Nested Structures

For more complex outputs with nested data structures:

```rust
// Define the custom struct used in the circuit
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UserData {
    pub id: u32,
    pub active: bool,
}

#[instruction]
pub fn complex_example() -> (
    UserData,
    Enc<Shared, u32>,
    (u64, f32),
    Enc<Mxe, bool>
) {
    // ... complex logic
}
```

**Generated types**:

```rust
pub struct ComplexExampleOutput {
    pub field_0: ComplexExampleOutputStruct0, // Entire tuple as single field
}

pub struct ComplexExampleOutputStruct0 {
    pub field_0: ComplexExampleOutputStruct00,  // UserData
    pub field_1: SharedEncryptedStruct<1>,      // Enc<Shared, u32>
    pub field_2: ComplexExampleOutputStruct02,  // (u64, f32) tuple
    pub field_3: MXEEncryptedStruct<1>,         // Enc<Mxe, bool>
}

pub struct ComplexExampleOutputStruct00 {
    pub field_0: u32,   // UserData.id
    pub field_1: bool,  // UserData.active
}

pub struct ComplexExampleOutputStruct02 {
    pub field_0: u64,   // First tuple element
    pub field_1: f32,   // Second tuple element
}
```

**Notice the naming pattern**: We have `ComplexExampleOutputStruct00` and `ComplexExampleOutputStruct02`, but no `ComplexExampleOutputStruct01`. This is because:

* `field_0` (UserData) needs a custom struct → `ComplexExampleOutputStruct00`
* `field_1` (SharedEncryptedStruct) uses a predefined type → no custom struct needed
* `field_2` ((u64, f32) tuple) needs a custom struct → `ComplexExampleOutputStruct02`
* `field_3` (MXEEncryptedStruct) uses a predefined type → no custom struct needed

Only fields that contain custom structs or tuples get their own generated struct definitions.

## Working with Generated Types

### Pattern Matching

Use destructuring to access nested data:

```rust
let ComplexExampleOutput {
    field_0: ComplexExampleOutputStruct0 {
        field_0: user_data,
        field_1: shared_encrypted,
        field_2: tuple_data,
        field_3: mxe_encrypted,
    }
} = match output {
    ComputationOutputs::Success(result) => result,
    _ => return Err(ErrorCode::AbortedComputation.into()),
};

// Access specific fields
let user_id = user_data.field_0;
let is_active = user_data.field_1;
let shared_value = shared_encrypted.ciphertexts[0];
let timestamp = tuple_data.field_0;
```

### Error Handling

Always handle computation failures:

```rust
let result = match output {
    ComputationOutputs::Success(data) => data,
    _ => return Err(ErrorCode::AbortedComputation.into()),
};
```

## Best Practices

### 1. Use Descriptive Variable Names

```rust
// Good
let FlipOutput { field_0: coin_result } = result;
let is_heads = coin_result.ciphertexts[0];

// Less clear
let FlipOutput { field_0 } = result;
let result = field_0.ciphertexts[0];
```

### 2. Document Your Circuit Interfaces

```rust
/// Returns (updated_game_state, player_hand, is_game_over)
#[instruction]
pub fn player_hit(/* ... */) -> (Enc<Mxe, GameState>, Enc<Shared, PlayerHand>, Enc<Shared, bool>) {
    // ...
}
```

### 3. Handle All Computation States

```rust
let result = match output {
    ComputationOutputs::Success(data) => data,
    _ => return Err(ErrorCode::AbortedComputation.into()),
};
```

### 4. Emit Events for Client Tracking

```rust
emit!(ComputationCompleteEvent {
    computation_id: ctx.accounts.computation_account.key(),
    success: true,
    result_hash: result.ciphertexts[0], // or use a hash function if needed
});
```

## When Things Go Wrong

Here are the most common issues and how to fix them:

### "Type not found" Errors

```rust
// Error: cannot find type `MyCircuitOutput` in this scope
output: ComputationOutputs<MyCircuitOutput>
```

This usually means one of two things:

1. **Typo in the circuit name** - Check that `MyCircuit` exactly matches your `#[instruction]` function name (case matters!)
2. **You forgot to rebuild** - Run `arcium build` again after making changes to your encrypted instructions

### "No field found" Errors

```rust
// Error: no field `result` on type `AddTogetherOutput`
let value = output.result;
```

Remember, the generated structs use numbered fields like `field_0`, `field_1`, etc. There's no field called `result` unless you specifically named your function that way.

Try this instead:

```rust
let value = output.field_0;  // First (and often only) field
```

### Encryption Type Mismatches

```rust
// Error: expected `SharedEncryptedStruct<1>`, found `MXEEncryptedStruct<1>`
```

This happens when your circuit returns `Enc<Mxe, T>` but your callback expects `Enc<Shared, T>` (or vice versa). Double-check your encrypted instruction's return type - it needs to match what you're expecting in the callback.

## Callback Not Working? Check These:

* [ ] Circuit name matches exactly (case sensitive)
* [ ] Ran `arcium build` after changing circuit
* [ ] Handling all ComputationOutputs variants
* [ ] Using correct field numbers (field\_0, field\_1, etc.)
* [ ] Array access within bounds (ciphertexts.len())

## Finding Generated Types

The best way to see generated types:

```bash
# First install cargo-expand if you haven't already
cargo install cargo-expand

# In your program directory
cargo expand | grep "YourCircuitOutput" -A 20
```

This shows exactly what structs were generated for your circuit.

You can also search the full output:

```bash
cargo expand > expanded.rs
# Then search expanded.rs for your circuit name
```

## Array and Complex Type Handling

### Fixed-Size Arrays

When your circuit returns arrays, each element becomes a separate scalar in the LEN count:

```rust
#[instruction]
pub fn process_batch() -> Enc<Shared, [u32; 3]> {
    // Process multiple values at once
    [result1, result2, result3]
}
```

This generates `SharedEncryptedStruct<3>` because the array has 3 elements:

```rust
pub struct ProcessBatchOutput {
    pub field_0: SharedEncryptedStruct<3>, // Array of 3 u32s
}
```

In your callback, access individual elements:

```rust
let encrypted_array = result.field_0;
let first_element = encrypted_array.ciphertexts[0];   // result1
let second_element = encrypted_array.ciphertexts[1];  // result2
let third_element = encrypted_array.ciphertexts[2];   // result3
```

### Nested Structures

For deeply nested data, LEN counts **all scalar values** at any depth:

```rust
pub struct Position {
    pub x: u32,
    pub y: u32,
}

pub struct Entity {
    pub position: Position,  // 2 scalars (x, y)
    pub health: u32,         // 1 scalar
    pub alive: bool,         // 1 scalar
}
// Total: 2 + 1 + 1 = 4 scalars

#[instruction]
pub fn update_entity() -> Enc<Shared, Entity> { /* ... */ }
```

Result: `SharedEncryptedStruct<4>` because Entity contains 4 total scalar values.

## Migration from v0.1.x

If you're upgrading from an older version, the new type generation system replaces manual byte parsing:

**Old way (v0.1.x)**:

```rust
pub fn encrypted_ix_callback(output: ComputationOutputs) -> Result<()> {
    let bytes = if let ComputationOutputs::Bytes(bytes) = output {
        bytes
    } else {
        return Err(ErrorCode::AbortedComputation.into());
    };

    let sum = bytes[48..80].try_into().unwrap();
    let nonce = bytes[32..48].try_into().unwrap();
    // ...
}
```

**New way (v0.2.0+/current)**:

```rust
pub fn encrypted_ix_callback(output: ComputationOutputs<AddTogetherOutput>) -> Result<()> {
    let AddTogetherOutput { field_0 } = match output {
        ComputationOutputs::Success(result) => result,
        _ => return Err(ErrorCode::AbortedComputation.into()),
    };

    let sum = field_0.ciphertexts[0];
    let nonce = field_0.nonce;
    // ...
}
```

For detailed migration steps, see the [Migration Guide](https://docs.arcium.com/developers/migration).

## Type Generation Limitations

### Supported Return Types

The type generation system works with most common Rust types, but has some constraints:

**✅ Supported:**

* Primitive types: `u8`, `u16`, `u32`, `u64`, `u128`, `i8`, `i16`, `i32`, `i64`, `i128`, `bool`
* Fixed-size arrays: `[T; N]` where N is a compile-time constant
* Tuples: `(T, U, V)` with any number of elements
* Custom structs with supported field types
* Nested combinations of the above

**❌ Not Supported:**

* Dynamic types: `Vec<T>`, `String`, `HashMap<K, V>`
* Reference types: `&T`, `&mut T` (except for input parameters)
* Generic types with lifetime parameters
* Recursive or self-referencing structs
* `Option<T>` or `Result<T, E>` as return types

### Practical Constraints

**Size Limitations:**

* Very large structs (1000+ fields) may impact compilation time
* Arrays with thousands of elements create correspondingly large LEN values
* Deep nesting (10+ levels) may cause macro expansion issues

**Naming Conflicts:**

```rust
// This would create a conflict:
#[instruction] pub fn test() -> u32        // → TestOutput
#[instruction] pub fn TEST() -> u32        // → TestOutput (same name!)
```

Function names must be unique when converted to PascalCase + "Output".

### Working Within Constraints

If you need unsupported types, consider these patterns:

```rust
// Instead of Vec<u32>, use fixed arrays:
#[instruction]
pub fn process() -> Enc<Shared, [u32; 10]> { /* ... */ }

// Instead of Option<T>, use a flag + value:
#[instruction]
pub fn maybe_compute() -> (Enc<Shared, bool>, Enc<Shared, u32>) {
    // (has_value, value)
}

// Instead of String, use fixed-size byte arrays:
#[instruction]
pub fn get_name() -> Enc<Shared, [u8; 32]> { /* ... */ }
```

## Common Patterns and Performance Tips

### Choosing the Right Encryption Type

* **Use `Enc<Shared, T>`** when users need to decrypt and verify results (votes, game outcomes, personal data)
* **Use `Enc<Mxe, T>`** for internal state that users shouldn't access (system secrets, aggregate statistics, protocol data)

### Performance Considerations

* **Large arrays**: `[u8; 1000]` becomes `SharedEncryptedStruct<1000>` - consider if you really need all elements encrypted
* **Complex nesting**: Deep struct hierarchies increase LEN values - flatten when possible
* **Mixed returns**: `(Enc<Shared, T>, Enc<Mxe, U>)` creates separate encrypted structs for optimal access patterns

### Testing Your Callbacks

Mock the computation outputs for testing:

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_callback_success() {
        let mock_output = ComputationOutputs::Success(YourCircuitOutput {
            field_0: SharedEncryptedStruct {
                encryption_key: [0u8; 32],
                nonce: 12345u128,
                ciphertexts: [[1u8; 32]],
            },
        });

        // Test your callback logic
        assert!(your_callback(mock_output).is_ok());
    }
}
```

## Quick Reference

| Return Type      | Generated Struct           | Access Pattern                          |
| ---------------- | -------------------------- | --------------------------------------- |
| `Enc<Shared, T>` | `SharedEncryptedStruct<1>` | `result.ciphertexts[0]`, `result.nonce` |
| `Enc<Mxe, T>`    | `MXEEncryptedStruct<1>`    | `result.ciphertexts[0]`, `result.nonce` |
| `(T, U, V)`      | `{Circuit}OutputStruct0`   | `result.field_0`, `result.field_1`      |
| Custom struct    | `{Circuit}OutputStruct0`   | `result.field_0`, `result.field_1`      |

**Callback pattern:**

```rust
#[arcium_callback(encrypted_ix = "your_function")]
pub fn callback(output: ComputationOutputs<YourFunctionOutput>) -> Result<()> {
    let result = match output {
        ComputationOutputs::Success(data) => data,
        _ => return Err(ErrorCode::AbortedComputation.into()),
    };
    // Access result.field_0, result.ciphertexts[0], etc.
}
```

***

The callback type generation system automatically handles encrypted computation results, eliminating manual byte parsing and offset tracking. With properly typed structs, you can work directly with structured data and focus on building your applications rather than handling low-level data conversion.

These generated types provide type safety and predictable patterns that make working with encrypted computation outputs straightforward and reliable.

# JavaScript Client

## Overview

Arcium offers two TS libraries, which provide tools and utilities for interacting with Arcium and the MXEs (MPC eXecution Environments) deployed on it.

Client library `@arcium-hq/client`:

* Handle secret sharing and encryption of inputs
* Submit confidential transactions
* Manage callbacks for computation results

Reader library `@arcium-hq/reader`:

* Read MXE data
* View computations for a given MXE

Generally speaking, the client library is used to build & invoke computations on MXEs and then track their outputs, while the reader library is more so to track the overall network. To get a better idea of its place in the general architecture, we highly recommend taking a look at the [computation lifecycle](https://docs.arcium.com/developers/computation-lifecycle).

## Installation

Client library:

{% tabs %}
{% tab title="npm" %}

```bash
npm install @arcium-hq/client
```

{% endtab %}

{% tab title="yarn" %}

```bash
yarn add @arcium-hq/client
```

{% endtab %}

{% tab title="pnpm" %}

```bash
pnpm add @arcium-hq/client
```

{% endtab %}
{% endtabs %}

Reader library:

{% tabs %}
{% tab title="npm" %}

```bash
npm install @arcium-hq/reader
```

{% endtab %}

{% tab title="yarn" %}

```bash
yarn add @arcium-hq/reader
```

{% endtab %}

{% tab title="pnpm" %}

```bash
pnpm add @arcium-hq/reader
```

{% endtab %}
{% endtabs %}

## API Reference

For complete TypeScript SDK documentation and API reference for the client and reader libraries, visit: [ts.arcium.com/api](https://ts.arcium.com/api)

## Using the client

Prefer a more step-by-step approach? Get started with learning [how to encrypt inputs for confidential transactions](https://docs.arcium.com/developers/js-client-library/encrypting).

# Encrypting inputs

Let's say we have the following confidential instruction that adds 2 encrypted `u8`s and returns the result as in plaintext:

```rust
use arcis_imports::*;

#[encrypted]
mod circuits {
    use arcis_imports::*;

    pub struct InputValues {
        v1: u8,
        v2: u8,
    }

    #[instruction]
    pub fn add_together(input_ctxt: Enc<Shared, InputValues>) -> u16 {
        let input = input_ctxt.to_arcis();
        let sum = input.v1 as u16 + input.v2 as u16;
        sum.reveal()
    }
}
```

We want to input the values `x = 42` and `y = 101` into this instruction. To do this, we first have to build the parameters for the confidential instruction correctly:

```ts
import { RescueCipher, getArciumEnv, x25519 } from "@arcium-hq/client";
import { randomBytes } from "crypto";

// Our confidential instruction takes two encrypted `u8` values as input, so we need to provide two ciphertext values which are represented as `[u8; 32]` in our Solana program.
const val1 = BigInt(1);
const val2 = BigInt(2);
const plaintext = [val1, val2];
```

Now that we have the inputs, we need to encrypt them. This is done using the `RescueCipher` class with some info about the MPC cluster we want to use:

```ts
// Fetch the MXE x25519 public key
const mxePublicKey = await getMXEPublicKeyWithRetry(
  provider as anchor.AnchorProvider,
  program.programId
);
// Generate a random private key for x25519 elliptic curve Diffie-Hellman key exchange.
const privateKey = x25519.utils.randomSecretKey();
// Derive the public key from the private key.
const publicKey = x25519.getPublicKey(privateKey);
// Generate a random nonce for the encryption.
const nonce = randomBytes(16);
// Get the shared secret with the cluster.
const sharedSecret = x25519.getSharedSecret(privateKey, mxePublicKey);
// Initialize the cipher with the shared secret.
const cipher = new RescueCipher(sharedSecret);
// Encrypt the plaintext, and serialize it to a `[u8; 32]` array.
const ciphertext = cipher.encrypt(plaintext, nonce);
```

To decrypt the data, again it follows a similar pattern:

```ts
// Initialize the cipher with the shared secret.
const cipher = new RescueCipher(sharedSecret);
const plaintext = cipher.decrypt(ciphertext, nonce);
```

# Tracking callbacks

Unlike regular transactions, confidential computations involve additional steps after your Solana transaction completes:

1. **Your transaction completes** - Encrypted data is submitted and queued in the MXE's mempool
2. **Computation waits in queue** - MPC nodes process computations from the mempool in order
3. **MPC execution** - When your computation's turn comes, MPC nodes execute it off-chain
4. **Callback invocation** - Results are returned via your callback instruction

This means you can't simply await a transaction completion like normal Solana programs. Instead, you need to wait for the entire computation lifecycle to finish. The Arcium client library provides utilities to handle this:

## Await computation completion with `awaitComputationFinalization`

```ts
// Generate a random 8-byte computation offset
const computationOffset = new anchor.BN(randomBytes(8), "hex");

// `program` is the anchor program client of the MXE we're invoking
// the instruction `ourIx` on (which then invokes a computation under the hood by CPIing into the Arcium program).
// `queueSig` is the signature of said transaction.
const queueSig = await program.methods
  .ourIx(
    // Computation offset that you provide when invoking the instruction
    computationOffset
    /* other inputs */
  )
  .accounts(/* some accounts */)
  .rpc();

// Since this is a Arcium computation, we need to wait for it to be finalized
// a little bit differently
const finalizeSig = await awaitComputationFinalization(
  // Anchor provider
  provider as anchor.AnchorProvider,
  // Computation offset that you provide when invoking the instruction
  computationOffset,
  // Program ID of the MXE
  program.programId,
  // Solana commitment level, "confirmed" by default
  "confirmed"
);

console.log("Computation was finalized with sig: ", finalizeSig);
```

# Deployment

## Getting Started with Deployment

So you've built and tested your MXE locally, and now you're ready to deploy it to Solana devnet. This guide will walk you through the deployment process and share some tips to make it go smoothly.

## What You'll Need

Before we dive into deployment, let's make sure you have everything ready:

* Your MXE built successfully with `arcium build`
* Tests passing locally with `arcium test`
* A Solana keypair with around 2-5 SOL for deployment costs (program deployment and account initialization)
* Access to a reliable RPC endpoint - we strongly recommend getting a free API key from [Helius](https://helius.dev), or [QuickNode](https://quicknode.com)

## Preparing Your Program

Before you deploy, there are a couple of important things to consider about how your program handles computation definitions.

### Handling Large Circuits with Offchain Storage

Here's something important to know: right now, Arcis compiled circuits aren't super efficient with their encoding, which means your circuit files can easily be several MBs in size. That makes initializing computation definitions on-chain pretty expensive - and will require a lot of transactions to fully upload.

The good news is you can store your circuits offchain instead. Just upload them to IPFS, a public S3 bucket, or even Supabase object storage - wherever works for you. Here's how to update your program to use offchain storage:

**Standard approach (works for small circuits):**

```rust
pub fn init_add_together_comp_def(ctx: Context<InitAddTogetherCompDef>) -> Result<()> {
    // This initializes the computation definition account
    init_comp_def(ctx.accounts, true, 0, None, None)?;
    Ok(())
}
```

**Offchain approach (recommended for larger circuits):**

```rust
// First, import the types you'll need
use arcium_client::idl::arcium::types::{CircuitSource, OffChainCircuitSource};

pub fn init_add_together_comp_def(ctx: Context<InitAddTogetherCompDef>) -> Result<()> {
    // Point to your uploaded circuit file
    init_comp_def(
        ctx.accounts,
        true,
        0,
        Some(CircuitSource::OffChain(OffChainCircuitSource {
            source: "https://your-storage.com/path/to/add_together_testnet.arcis".to_string(),
            hash: [0; 32], // Just use zeros for now - hash verification isn't enforced yet
        })),
        None,
    )?;
    Ok(())
}
```

With the offchain approach, you'll:

1. Build your project with `arcium build` to generate the circuit files
2. Upload the files from `build/` folder to your preferred storage service (files include network suffix, e.g., `add_together_testnet.arcis` for testnet)
3. Update your init functions in the Solana program with the public URLs
4. Run `arcium build` again to rebuild the Solana program with your changes

Note: Your circuit files must be publicly accessible without authentication. Make sure your storage service allows public read access.

This saves a ton on transaction costs and lets you work with much larger circuits!

### Note on Cluster Configuration

When testing locally, you've been using `arciumEnv.arciumClusterPubkey` in your test code. After deployment to devnet, you'll need to update this to use the actual cluster pubkey - we'll show you exactly how in the post-deployment section.

## Basic Deployment

The `arcium deploy` command handles both deploying your program and initializing the MXE account. Here's the basic command structure:

```bash
arcium deploy --cluster-offset <cluster-offset> --keypair-path <path-to-your-keypair> --rpc-url <your-rpc-url>
```

Let's break down what each parameter does:

### Understanding Cluster Offsets

The `--cluster-offset` tells your MXE which Arcium cluster it should connect to. Think of clusters as groups of nodes that will perform your encrypted computations. For devnet, you can choose from these offsets:

* `1078779259`
* `3726127828`
* `768109697`

Each represents a different cluster on devnet. They all work the same way, so just pick one for your deployment.

### Choosing Your RPC Provider

The `--rpc-url` parameter is particularly important. While you could use Solana's default RPC endpoints with the shorthand notation (`-u d` for devnet), the default RPC can be unreliable and cause deployment failures due to dropped transactions.

**Recommended approach with a reliable RPC:**

```bash
arcium deploy --cluster-offset 1078779259 \
  --keypair-path ~/.config/solana/id.json \
  --rpc-url https://devnet.helius-rpc.com/?api-key=<your-api-key>
```

**If you must use the default RPC:**

```bash
arcium deploy --cluster-offset 1078779259 \
  --keypair-path ~/.config/solana/id.json \
  -u d  # 'd' for devnet, 't' for testnet, 'l' for localnet
```

Just be prepared for potential transaction failures with the default RPC.

## Advanced Deployment Options

Once you're comfortable with basic deployment, you might want to customize things further.

### Adjusting Mempool Size

The mempool determines how many computations your MXE can queue up. The default "Tiny" size works fine for testing, but you might want more capacity for production:

```bash
arcium deploy --cluster-offset 1078779259 \
  --keypair-path ~/.config/solana/id.json \
  --rpc-url <your-rpc-url> \
  --mempool-size Medium
```

Available sizes are: `Tiny`, `Small`, `Medium`, `Large`. Start small and increase if you need more capacity.

### Using a Custom Program Address

If you need your program at a specific address (maybe for consistency across deployments), you can provide a program keypair:

```bash
arcium deploy --cluster-offset 1078779259 \
  --keypair-path ~/.config/solana/id.json \
  --rpc-url <your-rpc-url> \
  --program-keypair ./program-keypair.json
```

### Partial Deployments

Sometimes you might need to run just part of the deployment process. For instance, if you've already deployed the program but need to reinitialize the MXE account:

```bash
# Skip program deployment, only initialize MXE account
arcium deploy --cluster-offset 1078779259 \
  --keypair-path ~/.config/solana/id.json \
  --rpc-url <your-rpc-url> \
  --skip-deploy
```

Or if you only want to deploy the program without initialization:

```bash
# Deploy program only, skip MXE initialization
arcium deploy --cluster-offset 1078779259 \
  --keypair-path ~/.config/solana/id.json \
  --rpc-url <your-rpc-url> \
  --skip-init
```

## After Deployment

### Initialize Your Computation Definitions

Your MXE is deployed, but you still need to initialize the computation definitions. This tells the Arcium network what encrypted operations your MXE can perform. Computation definitions only need to be initialized once - they persist on-chain and don't need to be re-initialized unless you're deploying to a new program address. You can initialize them anytime after deployment completes successfully.

Remember how we mentioned you'd need to update your cluster configuration? Now's the time! You'll need to update your test or client code to use the actual cluster pubkey instead of the local testing environment.

**Replace this (local testing):**

```typescript
const arciumEnv = getArciumEnv();

// Later in your transaction...
.accountsPartial({
    clusterAccount: arciumEnv.arciumClusterPubkey,
    // ... other accounts
})
```

**With this (for devnet):**

```typescript
// Use the cluster offset from your deployment
const clusterAccount = getClusterAccAddress(cluster_offset); // e.g., getClusterAccAddress(1078779259)

// In your transaction...
.accountsPartial({
    clusterAccount: clusterAccount,
    // ... other accounts
})
```

Make sure to use the same `cluster_offset` value that you used during deployment! This ensures your program talks to the right cluster.

Once you've updated the cluster configuration, you can run the initialization:

```typescript
// Now with the correct cluster configured
await initAddTogetherCompDef(program, owner, false);
```

### Verify Everything's Working

Let's make sure your deployment succeeded:

```bash
solana program show <your-program-id> --url <your-rpc-url>
```

Then run your tests against the deployed program:

```bash
arcium test --skip-local-validator --provider.cluster devnet
```

Note: This will use the RPC endpoint configured for devnet in your Anchor.toml file or environment settings.

## Common Issues and Solutions

### Dealing with Dropped Transactions

If your deployment fails with transaction errors, it's almost always the RPC. Switch to a dedicated provider:

```bash
# Instead of this (unreliable):
arcium deploy ... -u d

# Use this (reliable):
arcium deploy ... --rpc-url https://devnet.helius-rpc.com/?api-key=<your-key>
```

### Running Out of SOL

Check your balance before deploying:

```bash
solana balance <your-keypair-pubkey> -u devnet
```

Need more devnet SOL? Request an airdrop:

```bash
solana airdrop 2 <your-keypair-pubkey> -u devnet
```

### Deployment Partially Failed?

No worries, you can complete the missing steps. If the program deployed but initialization failed, just run with `--skip-deploy`. If initialization succeeded but deployment failed, use `--skip-init`.

## What's Next?

With your MXE deployed, you're ready to:

1. Update your client code to connect to the deployed program
2. Initialize all your computation definitions
3. Run end-to-end tests with real encrypted computations
4. Monitor performance and adjust mempool size if needed

If you run into any issues or have questions, don't hesitate to reach out on [Discord](https://discord.gg/arcium)!

# Callback Server

When an encrypted instruction produces output that's too large to fit in a single Solana transaction (which has a size limit), you'll need to implement a callback server. This is a simple HTTP server that you develop and host yourself, which acts as an intermediary to receive large computation results from the MPC nodes and process them according to your application's needs.

For example, if your encrypted instruction produces a large output (say 10KB), the MPC nodes will first pack as much data as possible into the normal callback transaction (\~1KB), and send the remaining data (in this case \~9KB) to your callback server. This allows you to handle arbitrarily large outputs while still maintaining the efficiency of direct onchain callbacks when possible.

The callback server provides a simple HTTP endpoint that receives the computation output, verifies its authenticity using signatures from the MPC nodes, and processes the data according to your needs. This allows you to handle arbitrarily large computation results while maintaining the security guarantees of the Arcium protocol. Onchain, the callback server must also call the `finalize` transaction for the computation, where the Arcium program verifies that the data submitted by the callback server matches the data computed by the MPC nodes by comparing their hashes.

## API Interface

### POST /callback

Receives a raw byte object with the following structure:

`mempool_id|comp_def_offset|tx_sig|data_sig|pub_key|data`

* `mempool_id`: u16 - Mempool identifier
* `comp_def_offset`: u32 - Identifier for the given computation definition in the MXE program
* `tx_sig`: \[u8; 64] - The transaction signature of the callback transaction
* `data_sig`: \[u8; 64] - The signature of the data, signed by one of the node's private keys
* `pub_key`: \[u8; 32] - The public key of the node that signed the data
* `data`: Vec - The actual computation output to be processed

The server will then verify the signatures, and if they are valid, it will process the data.

The most common use case is to perform any necessary processing and submit the data back to the chain.

The server will then return a 200 OK response.

# Current Limitations

## Output sizes

Outputs of encrypted instructions should be able to fit in a single solana transaction (the callback transaction), otherwise you need to setup additional infrastructure to handle transaction data handling via [callback server](https://docs.arcium.com/developers/callback-server).

# Setup a Testnet Node

## Overview

> Public Testnet on Solana Devnet for stress testing. Real computations; no economic value.

As a testnet operator, you'll set up your own ARX node to participate in the Arcium network. This guide walks you through each step of the process.

First, you'll prepare your environment by installing the necessary tools and generating security keys. Then you'll get your node registered onchain and configure it to run. Finally, you'll connect to other nodes in a cluster and start doing computations.

By the end, you will:

* Install the Arcium tooling
* Generate required keypairs
* Fund accounts with Devnet SOL
* Initialize onchain node accounts
* Configure for Devnet
* Join or create a testnet cluster
* Deploy your node with Docker

## Prerequisites

Before starting, ensure you have the following installed:

* **Rust**: Install from [rustup.rs](https://rustup.rs/)
* **Solana CLI**: Install from [Solana's documentation](https://docs.solana.com/cli/install-solana-cli-tools)
* **Docker & Docker Compose**: Install from [Docker's documentation](https://docs.docker.com/get-docker/)
* **OpenSSL**: Install from [OpenSSL's documentation](https://www.openssl.org/source/) (usually pre-installed on macOS/Linux)
* **Git**: For cloning repositories and version control

You'll also need:

* A reliable internet connection
* Basic familiarity with command-line tools

**Windows Users:** Arcium doesn't run natively on Windows yet, but don't worry! You can use Windows Subsystem for Linux (WSL2) with Ubuntu to follow this guide. It works great and gives you the full Linux experience.

## Step 1: Set Up Your Workspace

Create a dedicated folder for your node setup to keep everything organized:

```bash
mkdir arcium-node-setup
cd arcium-node-setup
```

**Important:** Stay in this directory for all remaining steps. All file paths and Docker commands assume you're working from `arcium-node-setup/`.

You'll also need to know your public IP address for the next steps. Here's a quick way to find it:

```bash
curl https://ipecho.net/plain ; echo
```

## Step 2: Install Arcium Tooling

The Arcium tooling suite includes the CLI and ARX node software. Install it using the automated installer:

```bash
curl --proto '=https' --tlsv1.2 -sSfL https://arcium-install.arcium.workers.dev/ | bash
```

This script will:

* Check for all required dependencies
* Install `arcup` (Arcium's version manager)
* Install the latest Arcium CLI
* Install the ARX node software

Verify the installation:

```bash
arcium --version
arcup --version
```

If you prefer manual installation, see the [installation guide](https://docs.arcium.com/developers/installation) for detailed instructions.

## Step 3: Generate Required Keypairs

Security is crucial for node operations, so we'll create three separate keypairs that each handle different aspects of your node's functionality.

Your ARX node needs three different keypairs for secure operation. Create these in your `arcium-node-setup` directory:

### 3.1 Node Authority Keypair

This Solana keypair identifies your node and handles onchain operations:

```bash
solana-keygen new --outfile node-keypair.json --no-bip39-passphrase
```

**Note:** The `--no-bip39-passphrase` flag creates a keypair without a passphrase for easier automation.

### 3.2 Callback Authority Keypair

This Solana keypair signs callback computations and must be different from your node keypair for security separation:

```bash
solana-keygen new --outfile callback-kp.json --no-bip39-passphrase
```

### 3.3 Identity Keypair

This keypair handles node-to-node communication and must be in PKCS#8 format:

```bash
openssl genpkey -algorithm Ed25519 -out identity.pem
```

Keep these keypairs safe and private - they're like the master keys to your node. Store them securely and don't share them with anyone.

## Step 4: Fund Your Accounts

Now that you have your keypairs set up, your node and callback accounts need some Devnet SOL to pay for transaction fees. Let's get their addresses first, then add some funds.

Your node and callback accounts need Devnet SOL for transaction fees. Get their public keys first:

```bash
# Get your node public key
solana address --keypair node-keypair.json

# Get your callback public key
solana address --keypair callback-kp.json
```

Fund each account using the Solana CLI:

```bash
# Fund node account (replace <node-pubkey> with your actual public key)
solana airdrop 2 <node-pubkey> -u devnet

# Fund callback account (replace <callback-pubkey> with your actual public key)
solana airdrop 2 <callback-pubkey> -u devnet
```

**If the airdrop doesn't work:** No problem! You can also get Devnet SOL from the web faucet at <https://faucet.solana.com/>. Just paste your public keys there and request SOL - it's often more reliable than the CLI method.

## Step 5: Initialize Node Accounts

Now we'll register your node with the Arcium network by creating its onchain accounts. This step tells the blockchain about your node and its capabilities.

> **Tip:** Set your Solana CLI to Devnet once so you can avoid passing `--rpc-url <rpc-url>` repeatedly: `solana config set --url https://api.devnet.solana.com`

For guidance on choosing a reliable endpoint, see the [Devnet RPC Provider Recommendations](#devnet-rpc-provider-recommendations).

Use the `init-arx-accs` command to initialize all required onchain accounts for your node:

```bash
arcium init-arx-accs \
  --keypair-path node-keypair.json \
  --callback-keypair-path callback-kp.json \
  --peer-keypair-path identity.pem \
  --node-offset <your-node-offset> \
  --ip-address <your-node-ip> \
  --rpc-url https://api.devnet.solana.com
```

### Required Parameters:

* `--keypair-path`: Path to your node authority keypair
* `--callback-keypair-path`: Path to your callback authority keypair
* `--peer-keypair-path`: Path to your identity keypair (PEM format)
* `--node-offset`: Think of this as your node's unique ID number on the network. Choose a large random number (like 8-10 digits) to make sure it doesn't conflict with other nodes. If you get an error during setup saying your number is already taken, just pick a different one and try again.
* `--ip-address`: Your node's public IP address
* `--rpc-url`: Solana Devnet RPC endpoint

**Example:**

```bash
arcium init-arx-accs \
  --keypair-path node-keypair.json \
  --callback-keypair-path callback-kp.json \
  --peer-keypair-path identity.pem \
  --node-offset <your-node-offset> \
  --ip-address <YOUR_PUBLIC_IP> \
  --rpc-url https://api.devnet.solana.com
```

If successful, you'll see confirmation that your node accounts have been initialized onchain.

> **Note:** For better reliability, consider using dedicated RPC providers instead of the default public endpoints. See the [RPC Provider Recommendations](#devnet-rpc-provider-recommendations) section below.

## Step 6: Configure Your Node

Time to tell your node how to behave! The configuration file is like your node's instruction manual - it specifies which network to connect to, how to communicate with other nodes, and various operational settings.

Create a `node-config.toml` file in your `arcium-node-setup` directory:

```toml
[node]
offset = <your-node-offset>  # Your node offset from step 5
hardware_claim = 0  # Currently not required to specify, just use 0
starting_epoch = 0
ending_epoch = 9223372036854775807

[network]
address = "0.0.0.0" # Bind to all interfaces for reliability behind NAT/firewalls

[solana]
endpoint_rpc = "<your-rpc-provider-url-here>"  # Replace with your RPC provider URL or use default https://api.devnet.solana.com
endpoint_wss = "<your-rpc-websocket-url-here>"   # Replace with your RPC provider WebSocket URL or use default wss://api.devnet.solana.com
cluster = "Devnet"
commitment.commitment = "confirmed"  # or "processed" or "finalized"
```

> **Note:** If your node is behind NAT or a cloud firewall, ensure port 8080 is forwarded and allowed inbound on your public IP. Use your public IP for `--ip-address` during initialization; `network.address` controls the local bind address. Using `"0.0.0.0"` ensures the process binds to all local interfaces while peers connect to the public IP you registered during `init-arx-accs`.

## Step 7: Cluster Operations

Here's where things get collaborative! Clusters are groups of nodes that work together on computations during stress testing. You can either start your own cluster and invite others to join, or join an existing cluster that someone else created.

Clusters are groups of nodes that collaborate on MPC computations during stress testing. You have two options for cluster participation. For concepts and roles, see the [Clusters Overview](https://github.com/arcium-hq/arcium-docs/blob/add-builder-section/clusters/overview.md).

### Option A: Create Your Own Cluster

If you want to create a new cluster and invite other nodes:

```bash
arcium init-cluster \
  --keypair-path node-keypair.json \
  --offset <cluster-offset> \
  --max-nodes <max-nodes> \
  --rpc-url https://api.devnet.solana.com
```

**Parameters:**

* `--offset`: Unique identifier for your cluster (different from your node offset)
* `--max-nodes`: Maximum number of nodes in the cluster

**Example:**

```bash
arcium init-cluster \
  --keypair-path node-keypair.json \
  --offset <cluster-offset> \
  --max-nodes 10 \
  --rpc-url https://api.devnet.solana.com
```

### Option B: Join an Existing Cluster

To join an existing cluster, you need to be invited by the cluster authority. Once invited, accept the invitation:

```bash
arcium join-cluster true \
  --keypair-path node-keypair.json \
  --node-offset <your-node-offset> \
  --cluster-offset <cluster-offset> \
  --rpc-url https://api.devnet.solana.com
```

**Parameters:**

* `true`: Accept the join request (use `false` to reject)
* `--node-offset`: Your node's offset
* `--cluster-offset`: The cluster's offset you're joining

## Step 8: Deploy Your Node

You're almost there! Now we'll get your node up and running using Docker, which packages everything your node needs into a clean, isolated environment.

### Run with Docker (Recommended)

Run the ARX node container:

### 8.1 Prepare Log Directory

Before running Docker, create a local directory and log file for the container to write to:

```bash
mkdir -p arx-node-logs && touch arx-node-logs/arx.log
```

This ensures Docker can mount and write logs without permission issues.

### 8.2 Start the Container

Before running Docker, verify you're in the correct directory and have all required files:

```bash
pwd  # Should show: /path/to/arcium-node-setup
ls   # Should show: node-keypair.json, callback-kp.json, identity.pem, node-config.toml, arx-node-logs/
```

Now start the container:

```bash
docker run -d \
  --name arx-node \
  -e NODE_IDENTITY_FILE=/usr/arx-node/node-keys/node_identity.pem \
  -e NODE_KEYPAIR_FILE=/usr/arx-node/node-keys/node_keypair.json \
  -e OPERATOR_KEYPAIR_FILE=/usr/arx-node/node-keys/operator_keypair.json \
  -e CALLBACK_AUTHORITY_KEYPAIR_FILE=/usr/arx-node/node-keys/callback_authority_keypair.json \
  -e NODE_CONFIG_PATH=/usr/arx-node/arx/node_config.toml \
  -v "$(pwd)/node-config.toml:/usr/arx-node/arx/node_config.toml" \
  -v "$(pwd)/node-keypair.json:/usr/arx-node/node-keys/node_keypair.json:ro" \
  -v "$(pwd)/node-keypair.json:/usr/arx-node/node-keys/operator_keypair.json:ro" \
  -v "$(pwd)/callback-kp.json:/usr/arx-node/node-keys/callback_authority_keypair.json:ro" \
  -v "$(pwd)/identity.pem:/usr/arx-node/node-keys/node_identity.pem:ro" \
  -v "$(pwd)/arx-node-logs:/usr/arx-node/logs" \
  -p 8080:8080 \
  arcium/arx-node
```

**Notes:**

* The operator keypair uses the same file as your node keypair - this is intentional for simplified testnet setup
* Ensure port 8080 is open in your OS and cloud provider firewalls for inter-node communication

Tip: Save the same command as a reusable script for convenience:

```bash
#!/bin/bash

# Start the ARX node using Docker
docker run -d \
  --name arx-node \
  -e NODE_IDENTITY_FILE=/usr/arx-node/node-keys/node_identity.pem \
  -e NODE_KEYPAIR_FILE=/usr/arx-node/node-keys/node_keypair.json \
  -e OPERATOR_KEYPAIR_FILE=/usr/arx-node/node-keys/operator_keypair.json \
  -e CALLBACK_AUTHORITY_KEYPAIR_FILE=/usr/arx-node/node-keys/callback_authority_keypair.json \
  -e NODE_CONFIG_PATH=/usr/arx-node/arx/node_config.toml \
  -v "$(pwd)/node-config.toml:/usr/arx-node/arx/node_config.toml" \
  -v "$(pwd)/node-keypair.json:/usr/arx-node/node-keys/node_keypair.json:ro" \
  -v "$(pwd)/node-keypair.json:/usr/arx-node/node-keys/operator_keypair.json:ro" \
  -v "$(pwd)/callback-kp.json:/usr/arx-node/node-keys/callback_authority_keypair.json:ro" \
  -v "$(pwd)/identity.pem:/usr/arx-node/node-keys/node_identity.pem:ro" \
  -v "$(pwd)/arx-node-logs:/usr/arx-node/logs" \
  -p 8080:8080 \
  arcium/arx-node
```

Then run it:

```bash
chmod +x start.sh
./start.sh
```

## Step 9: Verify Node Operation

Check that your node is running correctly:

### Check Node Status

```bash
arcium arx-info <your-node-offset> --rpc-url https://api.devnet.solana.com
```

### Check if Node is Active

```bash
arcium arx-active <your-node-offset> --rpc-url https://api.devnet.solana.com
```

### Monitor Logs

If using Docker:

```bash
docker logs -f arx-node
```

## Devnet RPC Provider Recommendations

For better reliability when running your Testnet node, consider using dedicated RPC providers instead of the default public Solana Devnet endpoints.

### Why Use Dedicated RPC Providers

The default public Solana RPC endpoints have limitations that can affect your node's reliability:

* **Transaction Drops**: Public RPCs may drop transactions during high network congestion
* **Rate Limits**: Stricter limits on requests per second
* **Reliability**: No service level agreements or guaranteed uptime
* **Performance**: Slower response times compared to dedicated providers

### Recommended RPC Providers for Testnet

**Free tiers are completely sufficient for testnet participation - paid plans are NOT required.**

**Recommended Free Tier Options:**

* **Helius** - [helius.xyz](https://helius.xyz) (free tier works perfectly for testnet)
* **QuickNode** - [quicknode.com](https://quicknode.com) (free tier works perfectly for testnet)

**Optional Paid Plans (not needed for testnet):**

* Available from Helius, Triton, or QuickNode if you want enhanced features

The free tiers from Helius and QuickNode provide excellent reliability for testnet stress testing.

### Critical Operations Benefiting from Dedicated RPCs

The following operations are particularly sensitive to transaction reliability on Devnet:

* Node account initialization (`init-arx-accs`)
* Cluster creation and management (`init-cluster`)
* Cluster joining operations (`join-cluster`)
* Real-time node operations and computation handling

## What to Expect in Public Testnet

Your node is joining a real testing environment! Here's what you can expect:

* **Real Computations**: Your node will actually perform MPC computations to help stress test the network
* **Solana Devnet**: Everything runs on Solana's test network, so no real money is involved
* **Stress Testing Purpose**: You're helping test how well the network handles scale and performance
* **Variable Activity**: Sometimes it'll be busy, sometimes quiet - depends on what's being tested
* **No Rewards Yet**: This is pure testing - staking and rewards aren't enabled yet

Think of it as being part of a large-scale rehearsal before the main performance!

For updates on testnet activities and testing schedules, join the [Arcium Discord](https://discord.gg/arcium).

## Troubleshooting

### Common Issues

**1. Node Not Starting**

* Verify all keypair files exist and are readable
* Check that `node-config.toml` is valid TOML
* Ensure your IP address is accessible from the internet

**2. Account Initialization Failed**

* Verify you have sufficient SOL for transaction fees (at least 1 SOL per account)
* Check that your RPC endpoint is working
* Ensure node offset is unique

**3. Cannot Join Cluster**

* Verify you've been invited by the cluster authority
* Check that cluster has available slots
* Ensure your node is properly initialized

**4. Docker Issues**

* Verify Docker is running
* Check file permissions on mounted volumes
* Ensure ports are not already in use

### Getting Help

If you encounter issues:

1. Check the [Arcium Discord](https://discord.gg/arcium) for community support
2. Review the [troubleshooting section](https://docs.arcium.com/developers/installation#issues) in the installation guide
3. Ensure you're using the latest version of Arcium tooling

## Security Best Practices

* Never share your private keys
* Store keypairs securely and keep backups
* Use firewalls to restrict network access
* Keep your system and Docker images updated

## Next Steps

Once your Testnet node is running successfully:

1. **Join the Community**: Connect with other node operators on Discord
2. **Stay Updated**: Keep your Arcium tooling updated for the latest features

## Additional Resources

* [Arcium Network Overview](https://github.com/arcium-hq/arcium-docs/blob/add-builder-section/getting-started/architecture-overview.md)
* [Installation Guide](https://docs.arcium.com/developers/installation)

For questions or support, join our [Discord community](https://discord.gg/arcium)!



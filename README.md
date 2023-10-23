# d

[![codecov][codecov-badge]][codecov-project]

`d` is a CLI tool to help manage multi-packages workspace - mostly `flutter`
workspace. `d` is written [typescript] and powered by [deno]. We decided [deno]
as the language for `d` carefully. The main reason is not to has any dependency
on `dart` and `flutter`.

[melos] is a very powerful tool to help manage multi-packages workspace.

The biggest weak point of [melos] is that it depends on `dart` and `dart`'s
third-party libraries even though [melos] is a tool to manage `dart`/`flutter`
projects. Therefore, sometimes, [melos] users might run into problems regarding
to `dart/flutter pub get` or `melos bootstrap`.

This project is under developing actively.

## Table of contents

- [d](#d)
  - [Table of contents](#table-of-contents)
  - [Supported OS and architectures](#supported-os-and-architectures)
    - [MacOS](#macos)
    - [Linux](#linux)
  - [How to install](#how-to-install)
    - [Install the latest version](#install-the-latest-version)
    - [Install the specific version](#install-the-specific-version)
    - [To install `d` to the specific directory](#to-install-d-to-the-specific-directory)
    - [To put any other name instead of `d`](#to-put-any-other-name-instead-of-d)
  - [How to use `d`](#how-to-use-d)
    - [Make `d.yaml`](#make-dyaml)
    - [Specify dependencies in `pubspec.yaml`](#specify-dependencies-in-pubspecyaml)
    - [Run `d bootstrap`](#run-d-bootstrap)
  - [Commands](#commands)
    - [`bootstrap`](#bootstrap)
      - [Usage examples](#usage-examples)
    - [`pub`](#pub)
      - [Usage examples](#usage-examples-1)
    - [`build_runner`](#build_runner)
      - [Usage examples](#usage-examples-2)
    - [`test`](#test)
      - [Usage examples](#usage-examples-3)
    - [`graph`](#graph)
      - [Usage examples](#usage-examples-4)
    - [`clean`](#clean)
    - [`update`](#update)
  - [Common filters](#common-filters)
    - [Package filters](#package-filters)
    - [Dependency filters](#dependency-filters)
  - [Pre-defined environment variables](#pre-defined-environment-variables)

## Supported OS and architectures

### MacOS

- x86_64
- arm64: Thanks to
  [LukeChannings/deno-arm64](https://github.com/LukeChannings/deno-arm64)

### Linux

- x86_64
- arm64

## How to install

### Install the latest version

```sh
$ curl -fsSL https://d-install.jerry.company | bash
```

If you are a `bash` or a `zsh` user, you may need to add the following to the
end of your `~/.bashrc` or `~/.zshrc`:

```sh
export D_HOME="$HOME/.d"
export PATH="$D_HOME/bin:$PATH"
```

If you are a `fish` user, please execute the following:

```sh
$ mkdir -p $HOME/.config/fish/conf.d
$ echo "set -gx D_HOME $HOME/.d" \
  > $HOME/.config/fish/conf.d/d.fish
$ exec $SHELL -l
$ fish_add_path $D_HOME/bin
```

### Install the specific version

You can install the specific version of `d` like:

```sh
$ curl -fsSL https://d-install.jerry.company | bash -s vX.Y.Z
```

Please find the released versions at https://github.com/fenv-org/d/releases.

### To install `d` to the specific directory

The install script installs `d` to `$HOME/.d` directory by default. However, you
also specify another location like:

```sh
$ curl -fsSL https://d-install.jerry.company \
    | D_INSTALL_DIR=[other_directory] bash
```

### To put any other name instead of `d`

If there already exists any other CLI command `d` in your shell environment, you
can install `d` as any other name instead of `d`. For example, `oh-my-zsh` has a
pre-defined zsh function `d` to show directory history. In this case, the
feature will be useful.

To give any other name to `d`, sets `D_CLI` environment variable.

```bash
echo 'export D_CLI=other_command` >> ~/.bashrc
```

The above is an example for `bash` users. Please add `D_CLI` according to your
favorite shell.

And then, install `d` according to above installation instructions. `d`
installer will install `d` with the name you gave instead of `d`.

## How to use `d`

Let's assume the workspace's directory structure is:

```
workspace
  ├> app
  │  └> pubspec.yaml
  └> packages
     ├> package-a
     │  └> pubspec.yaml
     ├> package-b
     │  └> pubspec.yaml
     ├> package-c
     │  └> pubspec.yaml
     └> package-d
        ├> pubspec.yaml
        └> example
           ├> ios
           ├> android
           └> pubspec.yaml
```

And the dependency relations are:

- `app` requires `package-b` and `package-c`
- `package-b` requires `package-a` and `package-d`
- `package-c` requires `package-d`

### Make `d.yaml`

`d` CLI needs a configuration file `d.yaml`. You can place the file any where in
the repository.

If you place `d.yaml` under `app`, the `d.yaml` should look like:

```yaml
version: v0

name: "Workspace name here"

packages:
  include:
    - .
    - ../packages/**
  exclude:
    - "*example*"
```

Or if you place `d.yaml` file under `workspace`, the `d.yaml` should look like,
instead:

```yaml
version: v0

name: "Workspace name here"

packages:
  include:
    - app
    - packages/**
  exclude:
    - "*example*"
```

### Specify dependencies in `pubspec.yaml`

Then, we need to specify dependency relations among packages in `pubspec.yaml`
of each packages. Just leave the dependent package names.

- `workspace/app/pubspec.yaml`

  ```yaml
  ...
  dependencies:
    ...
    package-b: # No need to specify "path". `d` will take care on behalf of you.
    package-c:
    ...
  ...
  ```

- `workspace/packages/package-b/pubspec.yaml`
  ```yaml
  name: package-b
  ...
  dependencies:
    ...
    package-a:
    package-d:
    ...
  ...
  ```

- `workspace/packages/package-c/pubspec.yaml`
  ```yaml
  name: package-c
  ...
  dependencies:
    ...
    package-d:
    ...
  ...
  ```

### Run `d bootstrap`

To analyze the dependencies among linked packages, you should run `d bootstrap`
when you initially make a workspace and whenever the dependencies among managed
packages are changed. `d bootstrap` does _1. analyzing the dependencies among
packages_, _2. generating `pubspec_overrides.yaml` when needed_, and _3. running
`flutter pub get`_.

You can run it on any child directory of the directory that has `d.yaml` file.
`d` will find the nearest `d.yaml` file from the current working directory to
upward.

```sh
workspace/app>$ d bs # bs is an alias of `bootstrap`.
```

Then, `d` will generate `.d` directory on the workspace root and
`pubspec_overrides.yaml` files on some directories. Hence, we recommend to list
up `.d/` and `pubspec_overrides.yaml` to `.gitignore` file.

## Commands

### `bootstrap`

`bootstrap` is a command to find and link packages specified in `d.yaml`. After
`bootstrap`ping, `d` can run various commands for each linked packages
considering their dependency relationship.

`bootstrap` supports [package filters](#package-filters).

#### Usage examples

```shell
$ d bootstrap [--config <PATH-TO-d.yaml>]
# or
$ d bs [--config <PATH-TO-d.yaml>]
```

### `pub`

`pub` is a command to run `flutter pub <subcommand> [args...]` command in each
bootstrapped packages. You can run any arbitrary `flutter pub`'s subcommand with
this command.

`pub` supports [package filters](#package-filters) and
[dependency filters](#dependency-filters).

#### Usage examples

```shell
$ d pub [--config <PATH-TO-d.yaml>] get
$ d pub [--config <PATH-TO-d.yaml>] upgrade
```

### `build_runner`

`build_runner` is a command to run `dart run build_runner build/run/clean`
command in every bootstrapped package where has a dev dependency on the
`build_runner` package. `br` is an alias of `build_runner`.

`build_runner` supports [package filters](#package-filters) and
[dependency filters](#dependency-filters).

#### Usage examples

- `build_runner build`
  ```shell
  $ d build_runner build --delete-conflicting-outputs
  # or shortly
  $ d br b -d
  ```

- `build_runner run`
  ```shell
  $ d build_runner run --delete-conflicting-outputs \
      '$WORKSPACE_PATH'/target.dart -- \
      [script args...]
  # or shortly
  $ d br r -d \
      '$WORKSPACE_PATH'/target.dart -- \
      [script args...]
  ```

- `build_runner clean`
  ```shell
  $ d build_runner clean
  # or shortly
  $ d br c
  ```

### `test`

`test` is a command to run `flutter test [args...]` command in every
bootstrapped package that has any file matching `test/**/*_test.dart`.

`test` supports [package filters](#package-filters) and
[dependency filters](#dependency-filters).

#### Usage examples

```shell
$ d test --no-early-exit \
    --reporter expanded \
    --file-reporter \
    json:'$WORKSPACE_PATH'/reports/tests_'$PACKAGE_NAME'.json
```

### `graph`

`graph` is a command to describe the dependency relationship among linked
packages. `graph` command can be executed even if not `bootstrap`ped yet.

#### Usage examples

```shell
$ d graph
```

### `clean`

`clean` is a command to remove files that are automatically generated by `d`
such as a bootstrap cache directory `.d/` and `pubspec_overrides.yaml` files.

In addition, By specifying `-f` or `--flutter`, `d` can run `flutter clean` for
each package.

```shell
# Remove auto-generated files. You need to run `d bootstrap` again.
$ d clean 
# or
# Run `flutter clean` as well as removing auto-generated files.
$ d clean [--flutter]
```

### `update`

`update` is a command to self-update the `d` CLI or to list the available
versions.

```shell
# Updates `d` to the latest version.
$ d update

# Updates `d` to the specific version `X.Y.Z`.
# Downgrade as well as upgrade is supported.
$ d update vX.Y.Z
```

```shell
# Show all available versions.
$ d update [--show-list | -l]
```

## Common filters

### Package filters

- `--include-has-file <fileOrGlob>`:
  - `--if` is an alias.
  - Includes only packages where have any file that specifies the given pattern.
    The pattern can be a relative file path from the package root directory or a
    relative glob pattern from the package root directory.
  - Can be repeated.
- `--exclude-has-file <fileOrGlob>`:
  - `--ef` is an alias.
  - Excludes packages where have any file that specifies the given pattern. The
    pattern can be a relative file path from the package root directory or a
    relative glob pattern from the package root directory.
  - Can be repeated.
  - Prioritize `--include-has-file` option.
- `--include-has-dir <dirOrGlob>`:
  - `--id` is an alias.
  - Includes only packages where have any directory that specifies the given
    pattern. The pattern can be a relative directory path from the package root
    directory or a relative glob pattern from the package root directory.
  - Can be repeated.
- `--exclude-has-dir <dirOrGlob>`:
  - `--ed` is an alias.
  - Excludes packages where have any directory that specifies the given pattern.
    The pattern can be a relative directory path from the package root directory
    or a relative glob pattern from the package root directory.
  - Can be repeated.
  - Prioritize `--include-has-dir` option.

### Dependency filters

- `--include-dependency`:
  - Includes only packages where have a dependency on the given package.
  - Can be repeated.
- `--exclude-dependency`:
  - Excludes packages where have a dependency on the given package.
  - Can be repeated.
  - Prioritize `--include-dependency` option.
- `--include-direct-dependency`:
  - Includes only packages where have a "direct" dependency on the given
    package.
  - Can be repeated.
- `--exclude-direct-dependency`:
  - Excludes packages where have a "direct" dependency on the given package.
  - Can be repeated.
  - Prioritize `--include-direct-dependency` option.
- `--include-dev-dependency`:
  - Includes only packages where have a "dev" dependency on the given package.
  - Can be repeated.
- `--exclude-dev-dependency`:
  - Excludes packages where have a "dev" dependency on the given package.
  - Can be repeated.
  - Prioritize `--include-dev-dependency` option.

## Pre-defined environment variables

`d` provides some pre-defined environment variables. These environment variables
can be used in any command.

- `$WORKSPACE_PATH`: The absolute path of the directory where `d.yaml` file is
  located.
- `$PACKAGE_PATH`: The absolute path of the package root where a command is
  running on at the moment.
- `$PACKAGE_NAME`: The name of the package where a command is running on at the
  moment.

<!-- links -->

[codecov-project]: https://codecov.io/gh/fenv-org/d
[codecov-badge]: https://codecov.io/gh/fenv-org/d/graph/badge.svg?token=2P0R4NSNCQ
[melos]: https://pub.dev/packages/melos
[deno]: https://deno.com/
[typescript]: https://www.typescriptlang.org/

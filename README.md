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
$ curl -fsSL https://d-install.jerry.company | D_INSTALL_DIR=[other_directory] bash
```

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

To analyze the dependencies among linked packages, you should run `d bootstrap`.
`d bootstrap` does _1. analyzing the dependencies among packages_, _2.
generating `pubspec_overrides.yaml` when needed_, and _3. running
`flutter pub get`_.

You can run it on any child directory of the directory that has `d.yaml` file.
`d` will find the nearest `d.yaml` file from the current working directory to
upward.

```sh
workspace/app>$ d bs # bs is an alias of `bootstrap`.
```

Then, `d` will generate `pubspec_overrides.yaml` files on some directories. We
recommend to list up `pubspec_overrides.yaml` to `.gitignore` file. Because
`d bootstrap` will generate different `pubspec_overrides.yaml` whenever the
dependency graph's topology is changed.

In other words, you should run `d bootstrap` whenever the dependencies among
managed packages are changed.

<!-- links -->

[codecov-project]: https://codecov.io/gh/fenv-org/d
[codecov-badge]: https://codecov.io/gh/fenv-org/d/graph/badge.svg?token=2P0R4NSNCQ
[melos]: https://pub.dev/packages/melos
[deno]: https://deno.com/
[typescript]: https://www.typescriptlang.org/

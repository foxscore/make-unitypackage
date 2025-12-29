# Make UnityPackage

> [!CAUTION]
> If you were using `v1`, make sure to upgrade to `v1.1`, as there was a critical bug that made `.unitypackage` files uninstallable.

## Licensing

- Licensed under [GNU GPL v3 or later](https://spdx.org/licenses/GPL-3.0-or-later.html).
- The contents of the `dist` folder are unlincensed, and were generated using [ncc](https://www.npmjs.com/package/@vercel/ncc).

## Inputs

| Required | Parameter | Description                                                                                                                                                                                                                                      | Type     | Default |
| :------: | :-------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------- | :------ |
|    ✓     | `path`    | The directory that should be converted into a UnityPackage.                                                                                                                                                                                      | `string` |         |
|    ✓     | `saveTo`  | Where the .unitypackage file should be saved to.                                                                                                                                                                                                 | `string` |         |
|          | `icon`    | Path to the icon file. Must be a `png`.                                                                                                                                                                                                          | `string` | *Empty* |
|          | `prefix`  | A text that should be put infront of any files path. If your repository is the package itself, the prefix could be something like `Packages/com.example/`. If your repository is an entire Unity project, the prefix should be left out / empty. | `string` | *Empty* |

## Setup

Add the following snippet to your workflow file, with the appropriate parameters:

```yml
- name: Create UnityPackage
  uses: foxscore/make-unitypackage@v1
  with:
    path: Packages/com.example.package
    saveTo: ${{ env.unityPackage }}
```

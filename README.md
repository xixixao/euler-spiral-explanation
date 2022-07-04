Building roughly:

```sh
npx snowpack build
mv build/* docs/
# Ignore errors
# Revert CSS as its gone crazy
rm -r build
```

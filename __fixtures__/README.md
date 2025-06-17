# About This Directory

Normally this would be named `__mocks__` so that the Jest unit testing framework
would load the modules automatically, but this doesn't seem to be working for
ES modules right now. So this loading has to be done explicitly in the unit
test files.

Because the loading is done manually, the name `__mocks__` can't be used or
it will possibly make Jest unhappy, so instead the directory is named
something else: `__fixtures__`.
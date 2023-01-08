PACKAGE_JSON=$(PWD)/package.json
YARN_LOCK=$(PWD)/yarn.lock
NODE_MODULES=$(PWD)/node_modules/.yarn-integrity
$(NODE_MODULES): $(PACKAGE_JSON) $(PWD)/yarn.lock
	yarn install

SRC_DIR=$(PWD)/src
ALL_SOURCE_FILES=$(shell find $(SRC_DIR) -type f)
TEST_SOURCE_FILES=$(shell find $(SRC_DIR) -type f -name '*.spec.*')
SOURCE_FILES=$(filter-out $(TEST_SOURCE_FILES),$(ALL_SOURCE_FILES))

DIST_FOLDER=$(PWD)/dist
DIST_FILES=$(DIST_FOLDER)/srp.d.ts $(DIST_FOLDER)/srp.js $(DIST_FOLDER)/srp.js.map $(DIST_FOLDER)/srp.mjs $(DIST_FOLDER)/srp.mjs.map
$(DIST_FILES): $(NODE_MODULES) $(PACKAGE_JSON) $(SOURCE_FILES)
	yarn build

dependencies: $(NODE_MODULES)

build: $(DIST_FILES)

release: $(DIST_FILES)
	yarn publish --no-git-tag-version
	git tag v$$(cat $(PACKAGE_JSON) | node -e 'const fs = require("fs"); const stdin = fs.readFileSync(0); process.stdout.write(JSON.parse(stdin.toString()).version + "\n");')


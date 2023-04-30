run.js: .FORCE
	make -C .. game.js
	(cat ../game.js;echo; cat test.js) > "$@"
	node "$@"

.FORCE: ;

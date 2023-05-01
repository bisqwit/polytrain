all: database.js

parse_database: parse_database.cc
	g++ -o "$@" "$<" -Wall -Wextra -Ofast -march=native -g

database.js: parse_database database.txt
	@- rm -f "$@".new
	./parse_database < database.txt > "$@".new
	mv -f "$@".new "$@"

run.js: .FORCE
	- chmod +w "$@"
	make -C .. game.js
	(cat ../game.js;echo; cat test.js) > "$@".new
	mv -f "$@".new "$@"
	chmod -w "$@"
	#- node "$@"

.FORCE: ;

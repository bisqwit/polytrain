all: database.js database2.js

parse_database: parse_database.cc
	g++ -o "$@" "$<" -Wall -Wextra -Ofast -march=native -g

snap_database: snap_database.cc
	g++ -o "$@" "$<" -Wall -Wextra -Ofast -march=native -g

database-snap.txt: snap_database database.txt
	@- rm -f "$@".new
	./snap_database < database.txt > "$@".new
	mv -f "$@".new "$@"

database.js: parse_database database-snap.txt
	@- rm -f "$@".new
	./parse_database < database-snap.txt > "$@".new
	mv -f "$@".new "$@"

database2.js: create_ratings.js database2-template.js
	@- rm -f "$@".new
	node "$<" > "$@".new
	cat database2-template.js >> "$@".new
	mv -f "$@".new "$@"

create_database.js: \
		random.js fraction.js objfun.js poly_rank.js poly_rendertext.js \
		poly_simplify.js poly_generator.js create_database_main.js
	- chmod +w "$@"
	make -C .. game.js
	cat $^ > "$@".new
	mv -f "$@".new "$@"
	chmod -w "$@"
	#- node "$@"

create_ratings.js: \
		objfun.js poly_parse.js database.js \
		poly_rank.js poly_simplify.js fraction.js create_ratings_main.js
	- chmod +w "$@"
	cat $^ > "$@".new
	mv -f "$@".new "$@"
	chmod -w "$@"
	#- node "$@"

.FORCE: ;

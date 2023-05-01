SCRIPTS=\
	src/poly_parse.js \
	src/database.js \
	src/random.js \
	src/fraction.js \
	src/poly_generator.js \
	src/poly_rank.js \
	src/poly_render_dom.js \
	src/poly_rendertext.js \
	src/poly_simplify.js \
	src/objfun.js \
	src/domfun.js \
	src/imgfun.js \
	src/main.js \
	src/stars.js \
	src/challenge.js

JS=game.js
HTML=game.html

COPY=

STYLES=\
	src/game.css

PURE=passes=2,pure_funcs={F,K}

all: \
		$(JS) \
		$(HTML) \
		$(COPY)


src/database.js: src/database.txt src/parse_database.cc
	$(MAKE) -C src database.js

$(JS): $(SCRIPTS) Makefile
	@- chmod +w "$@"
	cat $(SCRIPTS) | terser --safari10 --timings --ie8 -c "$(PURE)" -m > "$@".new
	#cat $(SCRIPTS) > "$@".new
	mv -f "$@".new "$@"
	chmod -w "$@"

TMP=~/.tmptmp
$(HTML): src/game.html game.js $(STYLES) Makefile util/csstidy.sh
	rm -f $(TMP)
	echo '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">' > $(TMP)
	echo "<html><head>" >> $(TMP)
	echo "<meta http-equiv='Content-Type' content='text/html; charset=UTF-8'>" >> $(TMP)
	echo "<meta http-equiv='Content-Script-Type' content='text/javascript'>" >> $(TMP)
	echo "<script type='text/javascript' defer onload='boot()' src='$(JS)'></script>" >> $(TMP)
	echo "<style type='text/css'><!--" >> $(TMP)
	#cat $(STYLES) | util/csstidy.sh >> $(TMP)
	cat $(STYLES) | node util/csstidy.js src/game.css >> $(TMP)
	echo >> $(TMP)
	echo "--></style>" >> $(TMP)
	cat "$<" >> $(TMP)
	echo "</html>" >> $(TMP)
	#scp -Cp $(TMP) chii:.tmptmp
	- tidy  -utf8 -omit -w 99999  -m $(TMP)
	@- chmod +w "$@"
	mv -f $(TMP) "$@"
	chmod -w "$@"


varlist.txt: game.js util/find_words.pl
	grep -Fv '/*' $< | perl util/find_words.pl | sort|uniq > $@

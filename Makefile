SCRIPTS=\
	src/random.js \
	src/fraction.js \
	src/poly_generator.js \
	src/poly_rank.js \
	src/poly_parse.js \
	src/poly_render_dom.js \
	src/poly_rendertext.js \
	src/poly_simplify.js

JS=game.js
HTML=game.html

COPY=

STYLES=\
	src/game.css

all: \
		$(JS) \
		$(HTML) \
		$(COPY)


$(JS): $(SCRIPTS) Makefile util/jstidy.sh
	@- chmod +w "$@"
	#cat $(SCRIPTS) | util/jstidy.sh > "$@"
	cat $(SCRIPTS) > "$@"
	chmod -w "$@"

TMP=~/.tmptmp
$(HTML): src/game.html game.js $(STYLES) Makefile util/csstidy.sh
	rm -f $(TMP)
	echo '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">' > $(TMP)
	echo "<html><head>" >> $(TMP)
	echo "<meta http-equiv='Content-Type' content='text/html; charset=UTF-8'>" >> $(TMP)
	echo "<meta http-equiv='Content-Script-Type' content='text/javascript'>" >> $(TMP)
	echo "<script type='text/javascript' src='$(JS)'></script>" >> $(TMP)
	echo "<style type='text/css'><!--" >> $(TMP)
	cat $(STYLES) | util/csstidy.sh >> $(TMP)
	echo >> $(TMP)
	echo "--></style>" >> $(TMP)
	cat "$<" >> $(TMP)
	echo "</html>" >> $(TMP)
	- ssh chii tidy -utf8 -omit -w 99999  -m $(TMP)
	@- chmod +w "$@"
	mv -f $(TMP) "$@"
	chmod -w "$@"


varlist.txt: game.js util/find_words.pl
	grep -Fv '/*' $< | perl util/find_words.pl | sort|uniq > $@

#include <iostream>
#include <string>
#include <map>
#include <set>
#include <vector>
#include <stdio.h>
#include <unordered_map>
#include <unordered_set>
#include <algorithm>

static bool is_ident(char c)
{
    return (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') || c == '_';
}
static std::unordered_map<std::string, std::size_t> insertion_order;
static std::unordered_map<std::string, std::size_t> refcounts;
static std::unordered_map<std::string, std::string> replacements;
static std::unordered_set<std::string> blacklist;
static std::string makename()
{
    static const char firstlet[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_";
    static const char otherlet[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_0123456789";
    constexpr std::size_t n_firstlet = 26+26+1, n_secondlet = 26+26+1+10;
    static std::size_t len = 1, counter = 0;
redo:
    //for(std::size_t len=1; len<10; ++len)
    {
        //std::size_t counter = 0;
        std::string attempt(len, ' ');
        std::size_t max = n_firstlet;
        for(std::size_t k=1; k<len; ++k) max *= n_secondlet;
        while(counter < max)
        {
            std::size_t n = counter;
            attempt[0] = firstlet[n % n_firstlet];
            n /= n_firstlet;
            for(std::size_t k=1; k<len; ++k)
            {
                attempt[k] = otherlet[n % n_secondlet];
                n /= n_secondlet;
            }
            if(blacklist.find(attempt) == blacklist.end())
            {
                blacklist.insert(attempt);
                return attempt;
            }
            ++counter;
        }
        ++len; counter=0; goto redo;
    }
    return "?";
}
static const std::string& Catalog(const std::string& w)
{
    auto i = replacements.find(w);
    if(i != replacements.end())
    {
        ++refcounts[i->second];
        return i->second;
    }
    if(replacements.size() >= 5000) { static std::string tmp; return tmp; }
    std::string n = makename();
    std::cout << ",\n" << n << "=" << w;
    //refcounts.emplace(n, 1);
    //insertion_order[n] = insertion_order.size();
    i = replacements.emplace(w, std::move(n)).first;
    return i->second;
}
static void MakeExpressions(std::string& line, std::size_t start=0, std::size_t recursionlevel=0)
{
    if(recursionlevel >= 4) return;
    // Expressions to convert:
    //  [ ... ]
    //  K(..., ...)
    //  N(...)
    //  M(...)
    for(std::size_t a=start; a<line.size(); ++a)
    {
        if(line[a] == '[')
        {
            MakeExpressions(line, start+1, recursionlevel+1);
            if(a==0) return;
        }
        else if((line[a] == 'K' || line[a] == 'M' || line[a] == 'N') && line[a+1] == '(')
        {
            MakeExpressions(line, start+2, recursionlevel+1);
        }
        else if(line[a] == ']' || line[a] == ')') return;
        else
            continue;

        std::size_t balans=0, begin=a;
        for(; a < line.size(); ++a)
        {
            if(line[a] == '[' || line[a] == '(') ++balans;
            else if(line[a] == ']' || line[a] == ')')
            {
                if(balans == 0) return;
                if(--balans > 0) continue;
                std::size_t end = a+1;
                std::string substring(line.begin()+begin, line.begin()+end);
                auto r = refcounts.find(substring);
                if(r != refcounts.end() && r->second > 1)
                {
                    std::string replacement = Catalog(substring);
                    if(replacement.empty()) return;
                    line.replace(begin, end-begin, replacement);
                    a = begin + replacement.size() - 1;
                }
                else
                    a = end;
                break;
            }
            else continue;
        }
    }
}

static void ScanExpressions(const std::string& line, std::size_t start=0, std::size_t recursionlevel=0)
{
    if(recursionlevel >= 4) return;
    // Expressions to convert:
    //  [ ... ]
    //  K(..., ...)
    //  N(...)
    //  M(...)
    //  A(...)
    for(std::size_t a=start; a<line.size(); ++a)
    {
        if(line[a] == '[')
        {
            ScanExpressions(line, start+1, recursionlevel+1);
            if(a==0) return;
        }
        else if((line[a] == 'K' || line[a] == 'M' || line[a] == 'N') && line[a+1] == '(')
        {
            ScanExpressions(line, start+2, recursionlevel+1);
        }
        else if(line[a] == ']' || line[a] == ')') return;
        else
            continue;

        std::size_t balans=0, begin=a;
        for(; a < line.size(); ++a)
        {
            if(line[a] == '[' || line[a] == '(') ++balans;
            else if(line[a] == ']' || line[a] == ')')
            {
                if(balans == 0) return;
                if(--balans > 0) continue;
                std::size_t end = a+1;
                std::string substring(line.begin()+begin, line.begin()+end);
                //std::cerr <<  "Sub(" << substring << ")\n";
                ++refcounts[substring];
                a = begin+2;
                break;
            }
            else continue;
        }
    }
}

static void PruneExpressions()
{
    std::vector< std::pair<std::string, std::size_t> > order
        (insertion_order.begin(), insertion_order.end());
    std::sort(order.begin(), order.end(),
        [](auto& a, auto& b) { return a.second > b.second; });

    std::map<std::string, std::size_t> order2;
    for(auto& r: replacements)
        order2[r.first] = insertion_order.find(r.second)->second;

    for(auto& [token,index]: order)
    {
        std::size_t count = refcounts.find(token)->second;
        if(count == 1)
        {
            // Go through all strings in 'replacements', and replace references to 'token' with 'original'.
            std::string original = replacements[token];
            for(auto& r: replacements)
            {
                if(order2.find(r.first)->second > index)
                {
                    auto& w = r.second;
                    for(std::size_t begin=0;;)
                    {
                        std::size_t a = w.find(token, begin);
                        if(a == w.npos || a >= w.size()) break;
                        if(a > 0 && is_ident(w[ a-1])) { begin = a+token.size(); continue; }
                        if(a+token.size() < w.size() && is_ident(w[a+token.size()])) { begin = a+token.size(); continue; }
                        w.replace(a, a+token.size(), original);
                        begin = a + original.size();
                    }
                }
            }
        }
    }
}

int main()
{
/*
for s in vx vxx vy vyy;do echo -n "const ";for n in 0 1 2 3 4 5 6 7 8 9;do echo -n ",$s"m"$n=m(-$n,$s),$s$n=m($n,$s)";done;echo;done
echo -n "const";for n in 0 1 2 3 4 5 6 7 8 9;do echo -n ",v"m"$n=m(-$n,[]),v$n=m($n,[])";done;echo
*/
    std::cout << R"(
const simplification_tasks = (function(){
const K=(f,v=[])=>({fac:f,vars:v})
const M=f=>({mul:f})
const N=f=>({neg:f})
//const A=(...f)=>f
const F=s=>poly_parse(s,0)[2][0]['vars']
)";
    blacklist.insert("K");
    blacklist.insert("M");
    blacklist.insert("N");
    blacklist.insert("F");
    //blacklist.insert("A");
    blacklist.insert("abstract");
    blacklist.insert("arguments");
    blacklist.insert("await");
    blacklist.insert("boolean");
    blacklist.insert("break");
    blacklist.insert("byte");
    blacklist.insert("case");
    blacklist.insert("catch");
    blacklist.insert("char");
    blacklist.insert("class");
    blacklist.insert("const");
    blacklist.insert("continue");
    blacklist.insert("debugger");
    blacklist.insert("default");
    blacklist.insert("delete");
    blacklist.insert("do");
    blacklist.insert("double");
    blacklist.insert("else");
    blacklist.insert("enum");
    blacklist.insert("eval");
    blacklist.insert("export");
    blacklist.insert("extends");
    blacklist.insert("false");
    blacklist.insert("final");
    blacklist.insert("finally");
    blacklist.insert("float");
    blacklist.insert("for");
    blacklist.insert("function");
    blacklist.insert("goto");
    blacklist.insert("if");
    blacklist.insert("implements");
    blacklist.insert("import");
    blacklist.insert("in");
    blacklist.insert("instanceof");
    blacklist.insert("int");
    blacklist.insert("interface");
    blacklist.insert("let");
    blacklist.insert("long");
    blacklist.insert("native");
    blacklist.insert("new");
    blacklist.insert("null");
    blacklist.insert("package");
    blacklist.insert("private");
    blacklist.insert("protected");
    blacklist.insert("public");
    blacklist.insert("res");
    blacklist.insert("return");
    blacklist.insert("short");
    blacklist.insert("static");
    blacklist.insert("super");
    blacklist.insert("switch");
    blacklist.insert("synchronized");
    blacklist.insert("this");
    blacklist.insert("throw");
    blacklist.insert("throws");
    blacklist.insert("transient");
    blacklist.insert("true");
    blacklist.insert("try");
    blacklist.insert("typeof");
    blacklist.insert("var");
    blacklist.insert("void");
    blacklist.insert("volatile");
    blacklist.insert("while");
    blacklist.insert("with");
    blacklist.insert("yield");

    for(int x=0; x<=3; ++x)
    for(int y=0; y<=3; ++y)
    for(int a=0; a<=3; ++a)
    for(int b=0; b<=3; ++b)
    {
        std::string f = "";
        if(x) { f += 'x'; if(x>1) f += '0'+x; }
        if(y) { f += 'y'; if(y>1) f += '0'+y; }
        if(a) { f += 'a'; if(a>1) f += '0'+a; }
        if(b) { f += 'b'; if(b>1) f += '0'+b; }
        if(f.empty()) continue;
        std::cout << "," << f << "=F('" << f << "')";
        blacklist.insert(f);
        if(x&&y)
        {
            std::string f = "";
            if(y) { f += 'y'; if(y>1) f += '0'+y; }
            if(x) { f += 'x'; if(x>1) f += '0'+x; }
            if(a) { f += 'a'; if(a>1) f += '0'+a; }
            if(b) { f += 'b'; if(b>1) f += '0'+b; }
            /*
            std::string arr = "["; const char* sep = "\"";
            for(int m=0; m<y; ++m) { arr += sep; arr += 'y'; sep="\",\""; }
            for(int m=0; m<x; ++m) { arr += sep; arr += 'x'; sep="\",\""; }
            for(int m=0; m<a; ++m) { arr += sep; arr += 'a'; sep="\",\""; }
            for(int m=0; m<b; ++m) { arr += sep; arr += 'b'; sep="\",\""; }
            arr += "\"]";
            std::cout << "," << f << "=" << arr;
            */
            std::cout << "," << f << "=F('" << f << "')";
            blacklist.insert(f);
        }
    }
    for(int n=0; n<=10; ++n)
    {
        std::cout << ",X"<<n << "=K(" << n << ",x)";
        std::cout << ",XX"<<n << "=K(" << n << ",x2)";
        std::cout << ",Y"<<n << "=K(" << n << ",y)";
        std::cout << ",YY"<<n << "=K(" << n << ",y2)";
        std::cout << ",v"<<n << "=K(" << n << ")";
        blacklist.insert("X"+std::to_string(n));
        blacklist.insert("XX"+std::to_string(n));
        blacklist.insert("Y"+std::to_string(n));
        blacklist.insert("YY"+std::to_string(n));
        blacklist.insert("v"+std::to_string(n));
        if(n)
        {
            std::cout << ",Xm"<<n << "=K(-" << n << ",x)";
            std::cout << ",XXm"<<n << "=K(-" << n << ",x2)";
            std::cout << ",Ym"<<n << "=K(-" << n << ",y)";
            std::cout << ",YYm"<<n << "=K(-" << n << ",y2)";
            std::cout << ",vm"<<n << "=K(-" << n << ")";
            blacklist.insert("Xm"+std::to_string(n));
            blacklist.insert("XXm"+std::to_string(n));
            blacklist.insert("Ym"+std::to_string(n));
            blacklist.insert("YYm"+std::to_string(n));
            blacklist.insert("vm"+std::to_string(n));
        }
    }

    std::cerr << "Reading...\n";
    std::map<char/*terms*/,
    std::map<char/*vars*/,
    std::map<char/*mul_types*/,
    std::map<char/*negat*/,
    std::map<char/*power*/,
    std::map<char/*fract*/,
    std::set<std::string>>>>>>> data;

    static char buf[1048576*16];
    setbuffer(stdin, buf, sizeof(buf));

    std::string line;
    while(std::getline(std::cin, line))
    {
        if(line.substr(0,2) != "[\"")
            continue;

        {std::size_t b = line.find("//");
        if(b != line.npos)
            line.erase(line.begin()+b, line.end());
        while(line.size() > 0 && line[line.size()-1] == ' ')
            line.erase(line.begin()+line.size()-1);}

        for(std::size_t a=0; a+3<line.size(); ++a)
        {
            if(line[a] == 'm' && line[a+1] == '(' &&
              (line[a+2] == '-'
              || (line[a+2] >= '0' && line[a+2] <= '9')))
            {
                line[a] = 'K';
            }
        }
        /*
        BAN expressions that contain one of the following,
        where p = non-negative number:
        N(Xp)
        N(Yp)
        N(vp)
        N(XXp)
        N(YYp)
        */
        auto& v = data[line[2]]
            [line[3]]
            [line[4]]
            [line[5]]
            [line[6]]
            [line[7]];

        std::string phrase(line.begin()+11, line.end()-2);
        /*
        // Convert arrays into A() so that terser will join single-use ones.
        for(auto& c: phrase) if(c==']') c = ')';
        for(std::size_t b=0;;)
        {
            std::size_t s = phrase.find('[', b);
            if(s == phrase.npos) break;
            phrase.replace(s, 1, "A(");
            b = s+2;
        }
        */
        phrase = "[" + phrase + "]";
        v.emplace(phrase);
    }

    for(std::size_t round=0; round<2; ++round)
    {
        refcounts.clear();

        std::cerr << "Scanning...\n";
        for(auto& [term,data1]: data)
          for(auto& [var,data2]: data1)
            for(auto& [mul,data3]: data2)
              for(auto& [neg,data4]: data3)
                for(auto& [pow,data5]: data4)
                  for(auto& [fract,data6]: data5)
                    for(auto& l: data6)
                    {
                      //std::cerr << l << '\n';
                      ScanExpressions(l);
                    }

        std::cerr << "Compressing...\n";
        for(auto& [term,data1]: data)
          for(auto& [var,data2]: data1)
            for(auto& [mul,data3]: data2)
              for(auto& [neg,data4]: data3)
                for(auto& [pow,data5]: data4)
                  for(auto& [fract,data6]: data5)
                  {
                    std::set<std::string> w;
                    for(auto l: data6)
                    {
                        MakeExpressions(l);
                        w.insert(l);
                    }
                    data6 = std::move(w);
                  }
    }

    //std::cerr << "Pruning...\n";
    //PruneExpressions();

    std::cerr << "Outputting...\n";
    std::cout << ",\nres = {";
    for(auto& [term,data1]: data)
    {
      std::cout << "'" << term << "':{\n";
      for(auto& [var,data2]: data1)
      {
        std::cout << " '" << var << "':{\n";
        for(auto& [mul,data3]: data2)
        {
          std::cout << "  '" << mul << "':{\n";
          for(auto& [neg,data4]: data3)
          {
            std::cout << "   '" << neg << "':{\n";
            for(auto& [pow,data5]: data4)
            {
              std::cout << "     '" << pow << "':{\n";
              for(auto& [fract,data6]: data5)
              {
                std::cout << "      '" << fract << "':[\n";
                for(auto& l: data6)
                    std::cout << "        " << l << ",\n";
                std::cout << "],\n";
              }
              std::cout << "},\n";
            }
            std::cout << "},\n";
          }
          std::cout << "},\n";
        }
        std::cout << "},\n";
      }
      std::cout << "},\n";
    }
    std::cout << "}\n";
    std::cerr << "Done.\n";
std::cout << R"(
    return res;
})();
)";

}

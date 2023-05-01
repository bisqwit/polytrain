#include <iostream>
#include <string>
#include <map>
#include <set>
#include <vector>
#include <stdio.h>
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
const F=(s)=>poly_parse(s)[2][0]['vars']
)";
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
        /*std::string arr = "["; const char* sep = "\"";
        for(int m=0; m<x; ++m) { arr += sep; arr += 'x'; sep="\",\""; }
        for(int m=0; m<y; ++m) { arr += sep; arr += 'y'; sep="\",\""; }
        for(int m=0; m<a; ++m) { arr += sep; arr += 'a'; sep="\",\""; }
        for(int m=0; m<b; ++m) { arr += sep; arr += 'b'; sep="\",\""; }
        arr += "\"]";
        std::cout << "," << f << "=" << arr;*/
    }
    for(int n=0; n<=10; ++n)
    {
        std::cout << ",X"<<n << "=K(" << n << ",x)";
        std::cout << ",XX"<<n << "=K(" << n << ",x2)";
        std::cout << ",Y"<<n << "=K(" << n << ",y)";
        std::cout << ",YY"<<n << "=K(" << n << ",y2)";
        std::cout << ",v"<<n << "=K(" << n << ")";
        if(n)
        {
            std::cout << ",Xm"<<n << "=K(-" << n << ",x)";
            std::cout << ",XXm"<<n << "=K(-" << n << ",x2)";
            std::cout << ",Ym"<<n << "=K(-" << n << ",y)";
            std::cout << ",YYm"<<n << "=K(-" << n << ",y2)";
            std::cout << ",vm"<<n << "=K(-" << n << ")";
        }
    }
    std::cout << ",\nres = ";

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

        for(std::size_t a=0; a+3<line.size(); ++a)
        {
            if(line[a] == 'm' && line[a+1] == '(' &&
              (line[a+2] == '-'
              || (line[a+2] >= '0' && line[a+2] <= '9')))
            {
                line[a] = 'K';
            }
        }

        auto& v = data[line[2]]
            [line[3]]
            [line[4]]
            [line[5]]
            [line[6]]
            [line[7]];
        if(v.size() < 80)
            v.emplace(line.begin()+11, line.end()-2);
    }
    std::cout << "{";
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
                    std::cout << "        [" << l << "],\n";
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

std::cout << R"(
    return res;
})();
)";

}

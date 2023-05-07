#include <iostream>
#include <string>
#include <map>
#include <set>
#include <vector>
#include <stdio.h>
#include <unordered_map>
#include <unordered_set>
#include <algorithm>

int main()
{
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
        std::string orig_line = line;

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
        auto& v = data[line[2]]
            [line[3]]
            [line[4]]
            [line[5]]
            [line[6]]
            [line[7]];
        if(v.size() < 80)
            v.emplace(orig_line + "\n");
    }

    for(auto& [term,data1]: data)
      for(auto& [var,data2]: data1)
        for(auto& [mul,data3]: data2)
          for(auto& [neg,data4]: data3)
            for(auto& [pow,data5]: data4)
              for(auto& [fract,data6]: data5)
                for(auto& l: data6)
                    std::cout << l;
}

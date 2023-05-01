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
const vx=["x"],vxx=["x","x"],vxxx=["x","x","x"];
const vy=["y"],vyy=["y","y"],vyyy=["y","y","y"];
const vxy=["x","y"];
let m=(f,v=[])=>({fac:f,vars:v})
let M=f=>({mul:f})
let N=f=>({neg:f})
const vx0=m(0,vx),vxm1=m(-1,vx),vx1=m(1,vx),vxm2=m(-2,vx),vx2=m(2,vx),vxm3=m(-3,vx),vx3=m(3,vx),vxm4=m(-4,vx),vx4=m(4,vx),vxm5=m(-5,vx),vx5=m(5,vx),vxm6=m(-6,vx),vx6=m(6,vx),vxm7=m(-7,vx),vx7=m(7,vx),vxm8=m(-8,vx),vx8=m(8,vx),vxm9=m(-9,vx),vx9=m(9,vx),vxm10=m(-10,vx),vx10=m(10,vx)
const vy0=m(0,vy),vym1=m(-1,vy),vy1=m(1,vy),vym2=m(-2,vy),vy2=m(2,vy),vym3=m(-3,vy),vy3=m(3,vy),vym4=m(-4,vy),vy4=m(4,vy),vym5=m(-5,vy),vy5=m(5,vy),vym6=m(-6,vy),vy6=m(6,vy),vym7=m(-7,vy),vy7=m(7,vy),vym8=m(-8,vy),vy8=m(8,vy),vym9=m(-9,vy),vy9=m(9,vy),vym10=m(-10,vy),vy10=m(10,vy)
const vxx0=m(0,vxx),vxxm1=m(-1,vxx),vxx1=m(1,vxx),vxxm2=m(-2,vxx),vxx2=m(2,vxx),vxxm3=m(-3,vxx),vxx3=m(3,vxx),vxxm4=m(-4,vxx),vxx4=m(4,vxx),vxxm5=m(-5,vxx),vxx5=m(5,vxx),vxxm6=m(-6,vxx),vxx6=m(6,vxx),vxxm7=m(-7,vxx),vxx7=m(7,vxx),vxxm8=m(-8,vxx),vxx8=m(8,vxx),vxxm9=m(-9,vxx),vxx9=m(9,vxx),vxxm10=m(-10,vxx),vxx10=m(10,vxx)
const vyy0=m(0,vyy),vyym1=m(-1,vyy),vyy1=m(1,vyy),vyym2=m(-2,vyy),vyy2=m(2,vyy),vyym3=m(-3,vyy),vyy3=m(3,vyy),vyym4=m(-4,vyy),vyy4=m(4,vyy),vyym5=m(-5,vyy),vyy5=m(5,vyy),vyym6=m(-6,vyy),vyy6=m(6,vyy),vyym7=m(-7,vyy),vyy7=m(7,vyy),vyym8=m(-8,vyy),vyy8=m(8,vyy),vyym9=m(-9,vyy),vyy9=m(9,vyy),vyym10=m(-10,vyy),vyy10=m(10,vyy)
const v0=m(0,[]),vm1=m(-1,[]),v1=m(1,[]),vm2=m(-2,[]),v2=m(2,[]),vm3=m(-3,[]),v3=m(3,[]),vm4=m(-4,[]),v4=m(4,[]),vm5=m(-5,[]),v5=m(5,[]),vm6=m(-6,[]),v6=m(6,[]),vm7=m(-7,[]),v7=m(7,[]),vm8=m(-8,[]),v8=m(8,[]),vm9=m(-9,[]),v9=m(9,[]),vm10=m(-10,[]),v10=m(10,[])

const res =
)";

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

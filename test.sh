#!/bin/bash

#提取本服务器的IP地址信息
ENO1=`ifconfig | sed -n '1,1p' | awk -F ' ' '{print $1}'`
IP=`ifconfig ${ENO1}| grep "inet addr" | cut -f 2 -d ":" | cut -f 1 -d " "`
echo 'eno: '${ENO1}
echo 'IP: '${IP}

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# 各个监控警告值
WARN_LOAD=1.1
WARN_CPU=0.95
WARN_MEM=0.93
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
CPU=0.0
LOAD1=0.0
LOAD5=0.0
LOAD15=0.0
MEM=0.0
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #


send_mail() {
    echo 'send mail '  "${1}" "${2}"
}


# 1、监控系统负载的变化情况.
system_load_func()
{
    cpu_num=`grep -c 'model name' /proc/cpuinfo`

    load=$(uptime | awk -F 'load average: ' '{print $2}')
    load_1=$(echo $load | awk -F ', ' '{print $1}')
    load_5=$(echo $load | awk -F ', ' '{print $2}')
    load_15=$(echo $load | awk -F ', ' '{print $3}')

    #计算当前系统单个核心平均负载值，结果小于1.0时前面个位数补0。
    LOAD1=`echo "scale=2;a=${load_1}/${cpu_num};if(length(a)==scale(a)) print 0;print a" | bc`
    LOAD5=`echo "scale=2;a=${load_5}/${cpu_num};if(length(a)==scale(a)) print 0;print a" | bc`
    LOAD15=`echo "scale=2;a=${load_15}/${cpu_num};if(length(a)==scale(a)) print 0;print a" | bc`

    if [ `echo "${LOAD15} > ${WARN_LOAD}" | bc` -eq 1 ]
    then
        send_mail "${IP}服务器15分钟的系统平均负载为${LOAD15}, 超过警戒值${WARN_LOAD}, 请立即处理!" "$IP 服务器系统负载告警!"
    fi
}


# 2、监控系统cpu的情况.
cpu_func()
{
    #取当前空闲cpu百份比值(只取整数部分)
    cpu_idle=`top -b -d 0.1 -n 2 | grep Cpu | tail -n 1 | awk '{print $8}' | cut -f 1 -d "."`
    CPU=0`echo "scale=2; (100 - ${cpu_idle}) / 100" | bc`

    if [ `echo "${CPU} > ${WARN_CPU}" | bc` -eq 1 ]
    then
        send_mail "${IP}服务器cpu使用${CPU},请及时处理." "$IP 服务器CPU告警"
    fi
}


#3. 监控物理内存
mem_func()
{
    mem=$(free -m | sed -n '2,2p')
    mem_total=`echo ${mem} | awk -F ' ' '{print $2}'`
    mem_used=`echo ${mem} | awk -F ' ' '{print $3}'`
    # mem_free=`echo ${mem} | awk -F ' ' '{print $4}'`

    if [ $mem_used -ne 0 ]
    then
        MEM=0`echo "scale=2; ${mem_used} / ${mem_total}" | bc`
        if [ `echo "${MEM} > ${WARN_MEM}" | bc` -eq 1 ]
        then
            send_mail "$IP服务器物理内存已使用 ${MEM},请及时处理." "$IP 服务器内存告警"
        fi
    fi
}


CNT=1
print_info() {
    echo "# # # # # # # # # # # [${CNT}] # # # # # # # # # # # # # #"
    echo cpu: ${CPU}
    echo load1: ${LOAD1}
    echo load5: ${LOAD5}
    echo load15: ${LOAD15}
    echo mem: ${MEM}
    echo "# # # # # # # # # # # # # # # # # # # # # # # # # # #"
    (( CNT += 1 ))
    # exit 0
}


while true
do
    system_load_func
    cpu_func
    mem_func
    print_info
    sleep 5
done
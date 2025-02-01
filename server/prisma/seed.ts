import {PrismaClient} from "@prisma/client";
import bcrypt from "bcryptjs";


const prisma=new PrismaClient();


async function main(){
    const name="Super Admin";
    const email="admin@gmail.com";
    const password="123456";

    const existingSuperAdmin=await prisma.user.findFirst({
        where:{role:"SUPERADMIN"},

    })
    if(existingSuperAdmin)
    {
        return
    }
    const hashedPassword=await bcrypt.hash(password,10);
    const superAdminUser=await prisma.user.create({
        data:{
            name,email,password:hashedPassword,role:"SUPERADMIN"
        }
    })
    console.log("Super admin created success",superAdminUser.email)
}

main().catch((e)=>{
    console.error(e)
    process.exit(1);

}).finally(async()=>{
    await prisma.$disconnect()
})